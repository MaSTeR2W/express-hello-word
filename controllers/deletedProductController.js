const { unlink } = require("fs/promises");

const Product = require("./../models/productModel");
const Class = require("./../models/classificationModel");
const Cart = require("./../models/shoppingCartModel");
const Image = require("./../models/imageModel");

const { catchAsync } = require("./../utilities/catchFun");
const error = require("./../utilities/error");

exports.getDeletedProducts = catchAsync(async (req, res, next) => {
  const options = {
    limit: req.limit,
    offset: req.offset,
    where: `status="محذوف"`,
  };
  const products = await Product.select({}, options);

  if (products.length > 0) {
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
  }

  res.status(200).json(products);
});

exports.isDeletedProductExist = catchAsync(async (req, res, next) => {
  const product = await Product.selectOne(
    {},
    { where: `productId=${req.params.productId} AND status="محذوف"` }
  );

  if (product.length == 0)
    throw new error("لا يوجد منتج بهذا المُعرِف", 1113, 404, true);

  req.product = product;
  next();
});

exports.getDeletedProduct = catchAsync(async (req, res, next) => {
  req.product[0].images = await Image.select(
    {},
    { where: `productId=${req.product[0].productId}` }
  );
  res.status(200).json(req.product[0]);
});

exports.retrievingDeletedProduct = catchAsync(async (req, res, next) => {
  const id = req.query.classId;

  if (!id || !Number.isInteger(id - 0))
    throw new error(
      { queryProperty: "classId", errMessage: `classId: ${id} غير صالح` },
      1115,
      400,
      true
    );

  const _class = await Class.selectOne(
    {},
    { where: `classId=${id} AND status="موجود"` }
  );

  if (_class.length == 0)
    throw new error(
      {
        queryProperty: "classId",
        errMessage: `لا يوجد تصنيف بهذا المُعرِف (${id})`,
      },
      1117,
      404,
      true
    );

  await Product.sql(
    `UPDATE products , classifications SET products.status="موجود" , products.classId=${id} , products.deletedAt=NULL , classifications.numberOfProducts=${++_class[0]
      .numberOfProducts} WHERE products.productId=${
      req.product[0].productId
    } AND classifications.classId=${id}`
  );

  res.status(200).json();
});

exports.permanetlyDelete = catchAsync(async (req, res, next) => {
  const product = req.product;
  await Product.remove(`productId=${product[0].productId}`);

  const images = await Image.select(
    {},
    { where: `productId=${product[0].productId}` }
  );

  const promises = [];
  for (let i = 0; i < images.length; i++) {
    promises.push(unlink(`public${images[i].imageUrl}`));
  }
  images.length > 0 &&
    promises.push(Image.remove(`productId=${product[0].productId}`));

  product[0].addedToCart > 0 &&
    promises.push(Cart.remove(`productId=${product[0].productId}`));

  await Promise.all(promises);

  res.status(204).json();
});
