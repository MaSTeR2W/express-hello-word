const express = require("express");

const router = express.Router();

const authController = require("./../controllers/authController");

router.post("/signup" , authController.signup);
router.post("/verifyCode" , authController.registrationAuthentication , authController.allowedStatus("غير مفعل") , authController.verifyCode);

router.post("/login" , authController.login);
router.post("/logout" , authController.logout);

router.post("/regenerateVCode" , authController.registrationAuthentication , authController.allowedStatus("غير مفعل") ,authController.regenerateVCode);

router.post("/resetPassword1st" , authController.resetPassword1st);

router.post("/resetPassword2nd" , authController.registrationAuthentication , authController.allowedStatus("مفعل") , authController.resetPassword2nd);

module.exports = router;