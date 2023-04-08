const router = require("express").Router();

const authController = require("./../controllers/authController");
const imageController = require("./../controllers/imageController");
const paramsHandler = require("./../handlers/paramsHandler");
const imageHandler = require("./../handlers/imageHandler");

router.use(
  "/",
  authController.authenticate,
  authController.allowedStatus("مفعل"),
  authController.permissionTo("مسؤول", "مشرف")
);

router.use(
  "/:imageId",
  paramsHandler.validateId("imageId"),
  imageController.isImageExist
);

router
  .route("/:imageId")
  .patch(
    imageHandler.uploadImage,
    imageController.editImage,
    imageHandler.resizeImage
  )
  .delete(imageController.deleteImage);

module.exports = router;
