const express = require("express");

const router = express.Router();

const authController = require("./../controllers/authController");
const deletedClassController = require("./../controllers/deletedClassificationController");
const paramsHandler = require("./../handlers/paramsHandler");
const queryHandler = require("./../handlers/queryHandler");

router.use("/" , authController.authenticate , authController.allowedStatus("مفعل") , authController.permissionTo("مسؤول" , "مشرف"));

router.get("/" , queryHandler.validatePageNumber , deletedClassController.getDeletedClasses);

router.use("/:classId" , paramsHandler.validateId("classId") , deletedClassController.isDeletedClassExist);

router
    .route("/:classId")
    .get(deletedClassController.getDeletedClass)
    .put(deletedClassController.retrievingClass)
    .delete(deletedClassController.permanetlyDelete);

module.exports = router;