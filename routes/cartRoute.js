const express = require("express");

const router = express.Router({mergeParams:true});

const authController = require("./../controllers/authController");
const cartController = require("./../controllers/cartController");

const queryHandler = require("./../handlers/queryHandler");
const paramsHandler = require("./../handlers/paramsHandler");


router.use("/" , authController.authenticate , authController.allowedStatus("مفعل") , paramsHandler.validateId("userId") , cartController.isUserIdReleatedToCart);

router
    .route("/")
    .get(queryHandler.validatePageNumber , cartController.getProductsInCart)
    .post(cartController.isProductExist , cartController.addToCart);

router.use(
    "/:productId",
    paramsHandler.validateId("productId"),
    cartController.isProductExist,
    cartController.isProductInCart
);

router
    .route("/:productId")
    .get(cartController.getProductInCart)
    .patch(cartController.editProductInCart)
    .delete(cartController.deleteProductFromCart);


module.exports = router;
