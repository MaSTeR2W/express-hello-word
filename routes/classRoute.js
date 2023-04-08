const express = require("express");

const router = express.Router();

const classController = require("./../controllers/classificationController");
const authController = require("./../controllers/authController");

const queryHandler = require("./../handlers/queryHandler");
const paramsHandler = require("./../handlers/paramsHandler");
const imageHandler = require("./../handlers/imageHandler");

const productRoute = require("./productRoute");

router.use("/:classId/products" , productRoute);

router.get("/" , queryHandler.validatePageNumber , classController.getClasses);

router.get("/:classId" , paramsHandler.validateId("classId") , classController.isClassExist , classController.getClass);

router.use("/" , authController.authenticate , authController.permissionTo("مسؤول" , "مشرف") , authController.allowedStatus("مفعل"));

router.post("/" , imageHandler.uploadImage , classController.createClass , imageHandler.resizeImage);

router.patch("/:classId" , paramsHandler.validateId("classId") , classController.isClassExist , imageHandler.uploadImage , classController.editClass , imageHandler.resizeImage);

router.delete("/:classId" , paramsHandler.validateId("classId") , classController.isClassExist , classController.deleteClass);


module.exports = router;