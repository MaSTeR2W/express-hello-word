const router = require("express").Router({mergeParams:true});


const authController = require("./../controllers/authController");
const profileController = require("./../controllers/profileController");

const paramsHandler = require("./../handlers/paramsHandler");
const imageHandler = require("./../handlers/imageHandler");


router.patch("/" , authController.authenticate , authController.allowedStatus("مفعل") , paramsHandler.validateId("userId") , profileController.isUserExist , imageHandler.uploadImage , profileController.editProfile , imageHandler.resizeImage);


module.exports = router;