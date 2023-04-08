const express = require("express");
const router = express.Router();

const authController = require("./../controllers/authController");
const deletedProductController = require("./../controllers/deletedProductController");

const paramsHandler = require("./../handlers/paramsHandler");
const queryHandler = require("./../handlers/queryHandler");

router.use("/" , authController.authenticate , authController.allowedStatus("مفعل") , authController.permissionTo("مسؤول" , "مشرف"));

router.get("/" , queryHandler.validatePageNumber , deletedProductController.getDeletedProducts);

router.use("/:productId" , paramsHandler.validateId("productId") , deletedProductController.isDeletedProductExist);

router
    .route("/:productId")
    .get(deletedProductController.getDeletedProduct)
    .put(deletedProductController.retrievingDeletedProduct)
    .delete(deletedProductController.permanetlyDelete);

module.exports = router;