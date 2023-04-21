const express = require("express");
const router = express.Router();

const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");
const paramsHandler = require("./../handlers/paramsHandler");
const queryHandler = require("./../handlers/queryHandler");
const imageHandler = require("./../handlers/imageHandler");

const cartRoute = require("./cartRoute");
const profileRoute = require("./profileRoute");

router.use("/:userId/profile", profileRoute);
router.use("/:userId/cartProducts", cartRoute);

router.use(
  "/",
  authController.authenticate,
  authController.allowedStatus("مفعل")
);

router.delete(
  "/:userId",
  paramsHandler.validateId("userId"),
  userController.deleteUser
);

router.use("/:userId", paramsHandler.validateId("userId"));

router.get("/:userId", userController.getUser);

router.use("/", authController.permissionTo("مسؤول", "مشرف"));

router.get(
  "/",
  queryHandler.validatePageNumber,
  queryHandler.validateUserQuery,
  userController.getUsers
);

router.post(
  "/",
  imageHandler.uploadImage,
  userController.createUser,
  imageHandler.resizeImage
);

router.patch("/:userId", userController.editUser);

module.exports = router;
