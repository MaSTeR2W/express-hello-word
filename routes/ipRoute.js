const router = require("express").Router();

const ipController = require("./../controllers/ipLimiterController");
const authController = require("./../controllers/authController");


router.use("/" , authController.authenticate , authController.permissionTo("مسؤول" , "مشرف") , authController.allowedStatus("مفعل"));

router.get("/" , ipController.getIps);

router.use("/:ipAddress" , ipController.isIpExist);

router
    .route("/:ipAddress")
    .get(ipController.getIp)
    .patch(ipController.editIp)
    .delete(ipController.deleteIp);


module.exports = router;