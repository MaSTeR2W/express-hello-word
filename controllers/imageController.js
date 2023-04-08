const { unlink } = require("fs/promises");

const Image = require("./../models/imageModel");

const { catchAsync } = require("./../utilities/catchFun");
const error = require("./../utilities/error");
const { randomString } = require("./../utilities/myCrypto");

exports.isImageExist = catchAsync(async (req, res, next) => {
  const image = await Image.selectOne(
    {},
    { where: `imageId=${req.params.imageId}` }
  );

  if (image.length == 0)
    throw new error("لا يوجد صورة بهذا المُعرِف", 1317, 404, true);

  req.image = image;
  next();
});

exports.editImage = catchAsync(async (req, res, next) => {
  const image = req.image;

  const isMain = req.body.isMain;
  let set = [];
  if (isMain) {
    if (typeof isMain !== "boolean")
      throw new error(
        { fieldName: "isMain", errMessage: `القيمة ${isMain} غير صالحة` },
        1320,
        400,
        true
      );

    if (isMain === false)
      throw new error(
        {
          fieldName: "isMain",
          errMessage: "لا يمكن تحديد صورة على انها ليست الصورة الاساسية",
        },
        1322,
        403,
        true
      );

    if (image[0].isMain == 0) {
      set.push(`isMain=IF(imageId=${image[0].imageId}, true , false)`);
      image[0].isMain = 1;
    }
  }

  if (req.file) {
    const fileName = `products/${randomString(10)}_${new Date()
      .toISOStringV2()
      .replace(/:/g, "-")}.${req.file.type}`;

    set.push(
      `imageUrl=IF(imageId=${image[0].imageId} , "/images/${fileName}", imageUrl)`
    );

    req.file.fileName = fileName;
    await unlink(`public${image[0].imageUrl}`);
    image[0].imageUrl = `/images/${fileName}`;
  }
  if (set.length > 0)
    await Image.sql(
      `UPDATE images SET ${set} WHERE productId=${image[0].productId} `
    );

  req.file && (await next());

  res.status(200).json(image[0]);
});

exports.deleteImage = catchAsync(async (req, res, next) => {
  const image = req.image;

  await Image.sql(
    `UPDATE images SET isMain=true WHERE (productId=${image[0].productId} && imageId<>${image[0].imageId}) LIMIT 1`
  );

  await Image.remove(`imageId=${image[0].imageId}`);
  await unlink(`public${image[0].imageUrl}`);
  res.status(204).json();
});
