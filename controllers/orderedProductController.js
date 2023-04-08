const OrderedProduct = require("./../models/orderedProduct");
const Product = require("./../models/productModel");
const Image = require("./../models/imageModel");
const { catchAsync } = require("./../utilities/catchFun");
const error = require("./../utilities/error");
const { isExceededOrderLimit } = require("./../utilities/validation");

// مفروض ماحد يوصل الا لو كانت له او مشرف ويكون من البداية بكل (عالطلب)
exports.isOrderedProductExist = catchAsync(async (req, res, next) => {
  const order = req.order;
  const tableName = ["ملغي", "مُنجز"].includes(order[0].orderStatus)
    ? "orderedProductArchives"
    : "orderedProducts";

  const orderedProduct = await OrderedProduct.sql(
    `SELECT A.productId , A.price as purchasingPrice , A.quantity as requiredQuantity , totalPrice , productName , B.price as currentPrice , B.quantity as quantity , atRunsOut , purchased , status FROM ${tableName} as A LEFT JOIN products as B ON A.productId=B.productId WHERE A.orderId=${order[0].orderId} AND A.productId=${req.params.productId}`
  );

  if (orderedProduct.length == 0)
    throw new error("لا يوجد منتج مطلوب بهذا المُعرِف", 1171, 404, true);

  req.orderedProduct = orderedProduct;
  next();
});

exports.getOrderedProduct = catchAsync(async (req, res, next) => {
  req.orderedProduct[0].images = await Image.select(
    {},
    { where: `productId=${req.orderedProduct[0].productId}` }
  );
  res.status(200).json(req.orderedProduct[0]);
});

exports.getOrderedProducts = catchAsync(async (req, res, next) => {
  const options = {
    limit: req.limit,
    offset: req.offset,
  };

  const tableName = ["ملغي", "مُنجز"].includes(req.order[0].orderStatus)
    ? "orderedProductArchives"
    : "orderedProducts";

  const orderedProducts = await OrderedProduct.sql(
    `SELECT A.productId , A.price as purchasingPrice , A.quantity as requiredQuantity , totalPrice , productName , discountPercentage , oldPrice , B.price as currentPrice , B.quantity as quantity , atRunsOut , purchased , status FROM ${tableName} as A LEFT JOIN products as B ON A.productId=B.productId WHERE A.orderId=${req.order[0].orderId} LIMIT ${options.limit} OFFSET ${options.offset}`
  );

  if (orderedProducts.length > 0) {
    const idsOfProducts = [];
    for (let i = 0; i < orderedProducts.length; i++) {
      orderedProducts[i].images = [];
      idsOfProducts.push(orderedProducts[i].productId);
    }

    const images = await Image.select(
      {},
      { where: `productId IN (${idsOfProducts})` }
    );

    while (images.length > 0) {
      orderedProducts[idsOfProducts.indexOf(images[0].productId)].images.push(
        images.shift()
      );
    }
  }

  res.status(200).json(orderedProducts);
});

exports.editOrderedProduct = catchAsync(async (req, res, next) => {
  // quantity
  if (["ملغي", "مُنجز"].includes(req.order[0].orderStatus))
    throw new error("لا يمكن تعديل طلب مؤرشف");

  const quantity = req.body.quantity;
  const product = req.orderedProduct;

  const validateQuantity = await isExceededOrderLimit(
    { quantity: product[0].quantity - 0 + (product[0].requiredQuantity - 0) },
    quantity,
    false
  );

  if (validateQuantity instanceof Object)
    throw new error(validateQuantity, 1177, 400, true);
  else if (quantity == 0)
    throw new error(
      { fieldName: "quantity", errMessage: "لا يمكن تعديل الكمية لتصبح 0" },
      1178,
      400,
      true
    );

  if (product[0].requiredQuantity == quantity)
    return res.status(200).json(product[0]);

  let offset = quantity - product[0].requiredQuantity;
  offset >= 0 && (offset = "+" + offset);

  await OrderedProduct.sql(
    `UPDATE orderedProducts as A LEFT JOIN products as B ON A.productId=B.productId SET A.quantity=${quantity} , totalPrice=${quantity}*A.price , B.quantity=B.quantity-(${offset}) , B.purchased=B.purchased${offset} WHERE A.productId=${product[0].productId} AND A.orderId=${req.order[0].orderId}`
  );

  product[0].quantity -= offset - 0;
  product[0].requiredQuantity = quantity;
  product[0].totalPrice = quantity * product[0].purchasingPrice;
  product[0].purchased += offset - 0;

  res.status(200).json(product[0]);
});

exports.deleteOrderedProduct = catchAsync(async (req, res, next) => {
  if (["ملغي", "مُنجز"].includes(req.order[0].orderStatus))
    throw new error("لا يمكن حذف منتج مؤرشف");

  const product = req.orderedProduct;

  await OrderedProduct.sql(
    `DELETE FROM orderedProducts WHERE productId=${product[0].productId} AND orderId=${req.order[0].orderId}`
  );

  await Product.sql(
    `UPDATE products SET quantity=quantity+${product[0].requiredQuantity} , purchased=purchased-${product[0].requiredQuantity} WHERE productId=${product[0].productId}`
  );

  /* await Product.update({
        quantity: product[0].quantity + product[0].requiredQuantity,
        purchased: product[0].purchased - product[0].requiredQuantity
    } , `productId=${product[0].productId}`); */

  res.status(204).json();
});
