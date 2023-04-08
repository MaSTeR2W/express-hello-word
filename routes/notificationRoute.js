const router = require("express").Router();

const authController = require("./../controllers/authController");
const notificationController = require("./../controllers/notificationController");


router.use("/" , authController.isLogedIn , authController.authenticate , authController.allowedStatus("مفعل"));

router.get("/" , notificationController.getNotifications);

router.post("/" , notificationController.createNotification);

module.exports = router;