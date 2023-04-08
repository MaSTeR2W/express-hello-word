const { unlink } = require("fs/promises");

const Product = require("./../models/productModel");
const Class = require("./../models/classificationModel");
const Not = require("./../models/notificationModel");
const Image = require("./../models/imageModel");

const error = require("./../utilities/error");
const { catchAsync } = require("./../utilities/catchFun");
const { randomString } = require("./../utilities/myCrypto");
const { notificationValidator } = require("./../utilities/validation");

const { isIntegerValid } = require("./../utilities/validation");
const rigthZeros = (dNumber) => {
  for (let i = 2; i < dNumber.length; i++) {
    if (dNumber[2] != 0) return false;
  }
  return true;
};

// classification/1/products

exports.createProduct = catchAsync(async (req, res, next) => {
  const classification = req.classification;

  const body = req.body;

  const cPBody = {
    productName: body.productName,
    createdAt: new Date(),
    classId: classification[0].classId,
    quantity: body.quantity,
    price: body.price,
    description: body.description,
    atRunsOut: body.atRunsOut,
    orderLimit: body.orderLimit,
  };

  /* if (req.file) {
    req.file.fileName = `products/${randomString(10)}_${new Date()
      .toISOStringV2()
      .replace(/:/g, "-")}.${req.file.type}`;
    cPBody.image = `/images/${req.file.fileName}`;
  } else {
    delete cPBody.image;
  } */

  const product = await Product.insertOne(cPBody, {
    cols: "productId , productName , createdAt , deletedAt , status , addedToCart , purchased , classId , quantity , oldPrice , price , discountPercentage , description , atRunsOut , orderLimit",
    where: `createdAt="${cPBody.createdAt
      .toISOStringV2()
      .slice(0, 19)
      .replace("T", " ")}"`,
  });

  await Class.sql(
    `UPDATE classifications SET numberOfProducts=numberOfProducts+1 WHERE classId=${body.classId}`
  );

  if (!req.files || req.files.length == 0) {
    res.status(201).json(product);
  } else {
    req.product = product[0];
    next();
  }
});

exports.editProduct = catchAsync(async (req, res, next) => {
  const body = req.body;
  const product = req.product;
  const classification = req.classification;
  let _class;

  const ePBody = {};
  body.productName && (ePBody.productName = body.productName);
  body.quantity && (ePBody.quantity = body.quantity);
  body.price && (ePBody.price = body.price);
  (body.discountPercentage || body.discountPercentage === null) &&
    (ePBody.discountPercentage = body.discountPercentage);
  body.description && (ePBody.description = body.description);
  body.atRunsOut && (ePBody.atRunsOut = body.atRunsOut);
  body.orderLimit && (ePBody.orderLimit = body.orderLimit);

  if (body.classId) {
    if (!Number.isInteger(body.classId - 0))
      throw new error(
        {
          fieldName: "classId",
          errMessage: `classId: ${body.classId} غير صالح.`,
        },
        1111,
        400,
        true
      );

    _class = await Class.selectOne(
      {},
      { where: `classId=${body.classId} AND status="موجود"` }
    );

    if (_class.length == 0)
      throw new error({
        fieldName: "classId",
        errMessage: `لا يوجد تصنيف بهذا المُعرِف ${body.classId}`,
      });

    ePBody.classId = body.classId;
  }

  /*if (req.files) {
     product[0].image &&
      (await unlink(__dirname + `/../public${product[0].image}`).catch(
        (err) => {
          console.log(err);
        }
      ));
    req.file.fileName = `products/${randomString(10)}_${new Date()
      .toISOStringV2()
      .replace(/:/g, "-")}.${req.file.type}`;

    ePBody.image = `/images/${req.file.fileName}`; 
  }*/

  if (body.discountPercentage || body.discountPercentage === null) {
    if (body.discountPercentage === null && product[0].oldPrice) {
      ePBody.price = product[0].oldPrice;
      ePBody.oldPrice = null;
      body.notified = false;
    } else {
      const validateInteger = isIntegerValid(
        body.discountPercentage,
        100,
        1,
        "discountPercentage"
      );

      if (validateInteger instanceof Object)
        throw new error(validateInteger, 1200, 400, true);

      ePBody.oldPrice = product[0].price;
      ePBody.price = Math.floor(
        product[0].price * ((100 - body.discountPercentage) / 100)
      );
    }
  } else if (body.discountPrice || body.discountPrice === null) {
    if (body.discountPrice === null) {
      ePBody.price = product[0].oldPrice;
      ePBody.oldPrice = null;
      ePBody.discountPercentage = null;
      body.notified = false;
    } else {
      if (isNaN(body.discountPrice - 0))
        throw new error({
          fieldName: "discountPrice",
          errMessage: `القيمة ${body.discountPrice} غير صالحة.`,
        });

      let dNum = String(body.discountPrice).split(".")[1];
      if (dNum) {
        if (dNum.length > 2 && !rigthZeros(dNum))
          throw new error(
            {
              fieldName: "discountPrice",
              errMessage:
                "'صيغة العدد العشري غير صحيحة. يجب أن يكون العدد العشري: .25 أو .50 أو .75 أو .00'",
            },
            1201,
            400,
            true
          );

        dNum.length === 1 && (dNum = dNum + "0");

        if (!/([05][0]|[27][5])/.test(dNum) || dNum === "05")
          throw new error(
            {
              fieldName: "discountPrice",
              errMessage:
                "'صيغة العدد العشري غير صحيحة. يجب أن يكون العدد العشري: .25 أو .50 أو .75 أو .00'",
            },
            1201,
            400,
            true
          );
      }

      if (product[0].price <= body.discountPrice)
        throw new error(
          {
            fieldName: "discountPrice",
            errMessage: `لا يمكن لسعر التخفيض ${body.discountPrice} أن يكون أعلى من سعر المنتج أو يساويه ${product[0].price}`,
          },
          1202,
          400,
          true
        );

      ePBody.oldPrice = product[0].price;
      ePBody.price = body.discountPrice;
      ePBody.discountPercentage = Math.floor(
        100 - (ePBody.price * 100) / ePBody.oldPrice
      );
    }
  }

  if (_class) {
    await Promise.all([
      Class.sql(
        `UPDATE classifications SET numberOfProducts=numberOfProducts-1 WHERE classId=${product[0].classId}`
      ),
      //Class.update({numberOfProducts: classification[0].numberOfProducts-1} , `classId=${product[0].classId}`),
      Class.sql(
        `UPDATE classifications SET numberOfProducts=numberOfProducts+1 WHERE classId=${body.classId}`
      ),
      //Class.update({numberOfProducts: _class[0].numberOfProducts-0+1} , `classId=${body.classId}`)
    ]);
  }

  if (body.notified === true) {
    const now = new Date().toISOStringV2().slice(0, 19).replace("T", " ");
    const { title, content } = notificationValidator(
      body,
      "تخفيضات!!",
      `يوجد تخفيضات ${ePBody.discountPercentage}% على المنتج ${newProduct[0].productName}`
    );

    await Not.sql(
      `INSERT INTO notifications (userId , title , content , status , type , createdAt , productId , kind) (SELECT userId , "${title}" , "${content}" , "جديد" , "للمستخدم" , "${now}" , ${product[0].productId} , "تخفيض منتج" FROM users where users.status="مفعل" AND users.type="مستخدم" UNION SELECT visitorId as userId , "${title}" , "${content}" , "جديد" , "للزائر" , "${now}" , ${product[0].productId} , "تخفيض منتج" FROM visitors)`
    );
  } else if (body.notified === false) {
    await Not.remove(`productId=${product[0].productId}`);
  }

  let newProduct;
  if (Object.keys(ePBody).length > 0) {
    newProduct = await Product.update(
      ePBody,
      `productId=${product[0].productId}`
    );
    delete newProduct[0].productNameForSearch;
    res.status(200).json(newProduct[0]);
  } else {
    res.status(200).json({});
  }
});

exports.isProductExist = catchAsync(async (req, res, next) => {
  const product = await Product.selectOne(
    { productNameForSearch: false },
    {
      where: `productId=${req.params.productId} AND classId=${req.params.classId} AND status="موجود"`,
    }
  );

  if (product.length == 0) throw new error("المنتج غير موجود", 1029, 404, true);

  req.product = product;

  next();
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  await Product.update(
    { status: "محذوف", deletedAt: new Date() },
    `productId=${req.product[0].productId}`
  );

  await Class.sql(
    `UPDATE classifications SET numberOfProducts=numberOfProducts-1 WHERE classId=${req.classification[0].classId}`
  );

  await Not.remove(`productId=${req.product[0].productId}`);

  res.status(204).json();
});

exports.getProduct = catchAsync(async (req, res, next) => {
  req.product[0].images = await Image.select(
    {},
    { where: `productId=${req.product[0].productId}` }
  );
  res.status(200).json(req.product[0]);
});

exports.getProducts = catchAsync(async (req, res, next) => {
  // price , quantity , purchased , orderedby: createdAt , price , quantity , purchased , sort:ASC , DESC
  const options = {
    limit: req.limit,
    offset: req.offset,
  };

  (req.where &&
    (options.where = req.where) &&
    (options.where =
      `classId=${req.classification[0].classId} AND status="موجود" AND ` +
      options.where)) ||
    (options.where = `classId=${req.classification[0].classId} AND status="موجود"`);

  req.orderedBy &&
    (options.orderedBy = req.orderedBy) &&
    req.descending &&
    (options.descending = true);

  const products = await Product.select(
    { productNameForSearch: false },
    options
  );

  const images = await Image.select(
    {},
    {
      where: `productId IN (${products.map((el) => el.productId)})`,
      orderedBy: "productId",
    }
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
  res.status(200).json(products);
});
