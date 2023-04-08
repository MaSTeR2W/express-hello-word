const express = require("express");
const router = express.Router({ mergeParams: true });

const authController = require("./../controllers/authController");
const classController = require("./../controllers/classificationController");
const productController = require("./../controllers/productController");

const paramsHandler = require("./../handlers/paramsHandler");
const queryHandler = require("./../handlers/queryHandler");
const imageHandler = require("./../handlers/imageHandler");

router.get(
  "/",
  paramsHandler.validateId("classId"),
  classController.isClassExist,
  queryHandler.validatePageNumber,
  queryHandler.validateProductsQuery,
  productController.getProducts
);

router.get(
  "/:productId",
  paramsHandler.validateId("classId", "productId"),
  classController.isClassExist,
  productController.isProductExist,
  productController.getProduct
);

router.use(
  "/",
  authController.authenticate,
  authController.permissionTo("مشرف", "مسؤول"),
  authController.allowedStatus("مفعل")
);

router.post(
  "/",
  paramsHandler.validateId("classId"),
  classController.isClassExist,
  imageHandler.uploadMultiImages,
  productController.createProduct,
  imageHandler.resizeMultiImages
);

router.use(
  "/:productId",
  paramsHandler.validateId("classId", "productId"),
  classController.isClassExist,
  productController.isProductExist
);

router
  .route("/:productId")
  .patch(productController.editProduct)
  .delete(productController.deleteProduct);

module.exports = router;
