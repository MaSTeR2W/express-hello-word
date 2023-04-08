const express = require("express");

const router = express.Router();

const authController = require("./../controllers/authController");
const deletedUserController = require("./../controllers/deletedUserController");
const paramsHandler = require("./../handlers/paramsHandler");
const queryHandler = require("./../handlers/queryHandler");

router.use("/" , authController.authenticate , authController.permissionTo("مسؤول" , "مشرف") , authController.allowedStatus("مفعل"));

router.get("/" , queryHandler.validatePageNumber , deletedUserController.getDeletedUsers);

router.use("/:userId" , paramsHandler.validateId("userId") , deletedUserController.isDeletedUserExist);

router
    .route("/:userId")
    .get(deletedUserController.getDeletedUser)
    .delete(deletedUserController.permanentlyDelete)
    .put(deletedUserController.retrievingDeletedUser);

module.exports = router;
