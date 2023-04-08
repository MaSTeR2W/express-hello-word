const sharp = require("sharp");
const multer = require("multer");

const Image = require("./../models/imageModel");

const error = require("./../utilities/error");
const { catchAsync } = require("./../utilities/catchFun");
const { randomString } = require("./../utilities/myCrypto");

const storage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    if (file.size / 1024 / 1024 > 10)
      return cb(new error("حجم الملف كبير جدا", 1206, 413), false);
    file.type = "jpeg";
    cb(null, true);
  } else {
    cb(new error("الملف المرفق ليس صورة", 150, 415), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: multerFilter,
});

exports.uploadImage = upload.single("image");
exports.uploadMultiImages = upload.array("images", 10);

exports.resizeImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  const sharpedImage = sharp(req.file.buffer);
  const metadata = await sharpedImage.metadata();
  sharpedImage.toFormat("jpeg").jpeg({ quality: 80 });
  if (metadata.width > 1280) {
    const newHeight = (metadata.height * 1280) / metadata.width;
    sharpedImage
      .resize(1280, Math.round(newHeight))
      .toFile(`public/images/${req.file.fileName}`);
  } else {
    sharpedImage.toFile(`public/images/${req.file.fileName}`);
  }
});

exports.resizeMultiImages = catchAsync(async (req, res, next) => {
  const values = [];
  for (let i = 0; i < req.files.length; i++) {
    const fileName = `/images/products/${randomString(10)}_${new Date()
      .toISOStringV2()
      .replace(":", "-")}.jpeg`;

    values.push(`("${req.product.productId}" , "${fileName}" , ${i == 0})`);

    const sharpedImage = sharp(req.files[i].buffer);

    const metadata = await sharpedImage.metadata();

    sharpedImage.toFormat("jpeg").jpeg({ quality: 80 });

    if (metadata.width > 1280) {
      const newHeight = (metadata.height * 1280) / metadata.width;
      await sharpedImage
        .resize(1280, Math.round(newHeight))
        .toFile(`public${fileName}`);
    } else {
      await sharpedImage.toFile(`public${fileName}`);
    }
  }
  await Image.sql(
    `INSERT INTO images (productId , imageUrl , isMain) VALUES ${values.join(
      " , "
    )}`
  );

  req.product.images = await Image.select(
    {},
    { where: `productId=${req.product.productId}` }
  );
  res.status(200).json(req.product);
});
