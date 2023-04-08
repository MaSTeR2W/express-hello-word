const Cart = require("./../models/shoppingCartModel");
const Product = require("./../models/productModel");
const Image = require("./../models/imageModel");
const error = require("./../utilities/error");
const { catchAsync } = require("./../utilities/catchFun");

const { isExceededOrderLimit } = require("./../utilities/validation");
// post / get
//cart
// get , patch , delete.
//cart/productId

exports.isUserIdReleatedToCart = catchAsync(async (req, res, next) => {
  if (req.user[0].type == "مستخدم" && req.params.userId != req.user[0].userId)
    throw new error("ليس لديك الصلاحية للولوج", 1205, 403, true);

  next();
});

exports.isProductExist = catchAsync(async (req, res, next) => {
  let id;

  if (req.method == "POST") {
    id = req.body.productId;

    if (!Number.isInteger(id - 0))
      throw new error(
        { fieldName: "productId", errMessage: `productId: ${id} غير صالح.` },
        1119,
        400,
        true
      );
  } else id = req.params.productId;

  /*  const product = await Product.selectOne({} , {where:`productId=${id} AND status="موجود"`}); */
  const product = await Product.sql(
    `SELECT products.productId , classId , products.quantity as quantity , carts.quantity as requiredQuantity , discountPercentage , oldPrice ,price , price*carts.quantity as totalPrice , productName , atRunsOut , image , addedToCart , status , orderLimit FROM products LEFT JOIN carts ON carts.productId=products.productId AND carts.userId=${req.params.userId} WHERE products.productId=${id}`
  );

  if (product.length == 0)
    throw new error(
      {
        fieldName: "productId",
        errMessage: `لا يوجد منتج بهذا المُعرِف (${id})`,
      },
      1121,
      404,
      true
    );

  req.product = product;
  next();
});

exports.isProductInCart = catchAsync(async (req, res, next) => {
  if (!req.product[0].requiredQuantity)
    throw new error("المنتج غير موجود في السلة", 1127, 404, true);

  next();
});

exports.addToCart = catchAsync(async (req, res, next) => {
  const cartItems = await Cart.count(`userId=${req.user[0].userId}`);

  const product = req.product;
  const body = req.body;

  if (
    cartItems - 0 >= ApplicationOption.maximumCartItems &&
    product[0].requiredQuantity === null
  )
    throw new error("السلة ممتلئة", 1238, 405, true);

  if (product[0].status == "محذوف")
    throw new error("المنتج اللذي تحاول اضافته قد تم حذفه", 1125, 405, true);

  const quantity = body.quantity - 0 + (product[0].requiredQuantity || 0);

  const validateQuantity = await isExceededOrderLimit(product[0], quantity);

  if (validateQuantity instanceof Object)
    throw new error(validateQuantity, 1123, 400, true);

  body.userId = req.user[0].userId;

  await Product.sql(
    `UPDATE products SET addedToCart=addedToCart+${body.quantity} WHERE productId=${product[0].productId}`
  );
  // may be cause a race condetion
  /* await Product.update({addedToCart:(product[0].addedToCart-0) - (-body.quantity)} , `productId=${req.product[0].productId}`); */

  if (!product[0].requiredQuantity) {
    await Cart.insertOne(body);
  } else {
    body.quantity = quantity;
    await Cart.update(body, `productId=${body.productId}`, false);
  }

  res.status(201).json();
});

exports.getProductsInCart = catchAsync(async (req, res, next) => {
  const options = {
    limit: req.limit,
    offset: req.offset,
  };

  const products = await Cart.sql(
    `SELECT carts.productId , classId , products.quantity as quantity , carts.quantity as requiredQuantity , discountPercentage ,oldPrice , price , carts.quantity*products.price as totalPrice , productName , atRunsOut , addedToCart , status FROM carts INNER JOIN products ON carts.productId=products.productId WHERE carts.userId=${req.params.userId} LIMIT ${options.limit} OFFSET ${options.offset}`
  );

  const images = await Image.select(
    {},
    { where: `productId IN (${products.map((el) => el.productId)})` }
  );

  const idsOfProducts = [];
  for (let i = 0; i < products.length; i++) {
    products[i].images = [];
    idsOfProducts.push(products[i].productId);
  }

  while (images.length > 0) {
    products[idsOfProducts.indexOf(images[0].productId)].images.push(
      images.shift()
    );
  }

  const numberOfProducts = await Cart.count(`userId=${req.user[0].userId}`);

  res.status(200).json({ products, numberOfProducts });
});

exports.getProductInCart = catchAsync(async (req, res, next) => {
  req.product[0].images = await Image.select(
    {},
    { where: `productId=${req.product[0].productId}` }
  );
  res.status(200).json(req.product[0]);
});

exports.deleteProductFromCart = catchAsync(async (req, res, next) => {
  await Cart.remove(`productId=${req.params.productId}`);
  res.status(204).json();
  await Product.sql(
    `UPDATE products SET addedToCart=addedToCart-${req.product[0].requiredQuantity} WHERE productId=${req.params.productId}`
  );
  // may cause a Race condetion
  /* await Product.update({addedToCart: (req.product[0].addedToCart-0) - (req.product[0].requiredQuantity-0)} , `productId=${req.params.productId}`); */
});

exports.editProductInCart = catchAsync(async (req, res, next) => {
  const product = req.product;

  if (product[0].status == "محذوف")
    throw new error("لا يمكن تعديل منتج محذوف", 1129, 405, true);

  const quantity = req.body.quantity;

  const validateQuantity = await isExceededOrderLimit(
    {
      orderLimit: product[0].orderLimit,
      quantity: product[0].quantity + product[0].requiredQuantity,
    },
    quantity - 0
  );

  if (validateQuantity instanceof Object)
    throw new error(validateQuantity, 1131, 400, true);

  if (quantity == product[0].requiredQuantity)
    return res.status(200).json({
      productId: product[0].productId,
      quantity: product[0].requiredQuantity,
      totalPrice: product[0].totalPrice,
    });

  const newCartProduct = await Cart.update(
    { quantity },
    `productId=${product[0].productId} AND userId=${req.user[0].userId}`
  );

  res.status(200).json({
    productId: newCartProduct[0].productId,
    quantity: newCartProduct[0].requiredQuantity,
    totalPrice: quantity * product[0].price,
  });

  Product.sql(
    `UPDATE products SET addedToCart=addedToCart-(${
      product[0].requiredQuantity - quantity
    }) WHERE productId=${product[0].productId}`
  );
  // may cause race condetion;
  /* Product.update({addedToCart:(product[0].addedToCart-0) - (product[0].requiredQuantity - quantity)} , `productId=${product[0].productId}`); */
});
