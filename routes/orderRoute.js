const express = require("express");

const router = express.Router();

const authController = require("./../controllers/authController");
const orderController = require("./../controllers/orderController");

const paramsHandler = require("./../handlers/paramsHandler");
const queryHandler = require("./../handlers/queryHandler");

const orderedProductRoute = require("./orderedProductRoute");

router.use("/:orderId/orderedProducts" , orderedProductRoute);

router.use("/" , authController.authenticate , authController.allowedStatus("مفعل"));

router
    .route("/")
    .post(authController.permissionTo("مستخدم") , orderController.addCreateOrder)
    .get(queryHandler.validatePageNumber , queryHandler.validateOrdersQuery , orderController.getOrders);

router.delete("/" , authController.permissionTo("مسؤول") , queryHandler.validateDateQuery , orderController.deleteOrders);


router.use("/:orderId" , paramsHandler.validateId("orderId") , orderController.isOrderExist);

router.get("/:orderId" , orderController.getOrder);

router.use("/:orderId" , authController.permissionTo("مسؤول" , "مشرف"));

router
    .route("/:orderId")
    .patch(orderController.editOrder)
    .delete(orderController.deleteOrder);

module.exports = router;

