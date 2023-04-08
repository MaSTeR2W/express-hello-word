const express = require("express");
const router = express.Router({mergeParams: true});

const authController = require("./../controllers/authController");
const orderedProductController = require("./../controllers/orderedProductController");
const orderController = require("./../controllers/orderController");


const paramsHandler = require("./../handlers/paramsHandler");
const queryHandler = require("./../handlers/queryHandler");

router.use("/" , authController.authenticate , authController.allowedStatus("مفعل"));

// user: get orderedProduct, get orderedProducts

router.get("/" , paramsHandler.validateId("orderId") , orderController.isOrderExist , queryHandler.validatePageNumber , orderedProductController.getOrderedProducts);

router.get("/:productId" , paramsHandler.validateId("productId" , "orderId") , orderController.isOrderExist , orderedProductController.isOrderedProductExist , orderedProductController.getOrderedProduct);

router.use("/:productId" , authController.permissionTo("مسؤول" , "مشرف") , paramsHandler.validateId("orderId" , "productId") , orderController.isOrderExist , orderedProductController.isOrderedProductExist);


router
    .route("/:productId")
    .patch(orderedProductController.editOrderedProduct)
    .delete(orderedProductController.deleteOrderedProduct);

module.exports = router;
