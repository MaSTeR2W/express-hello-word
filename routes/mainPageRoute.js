const router = require("express").Router();

const Product = require("./../models/productModel");

const {catchAsync} = require("./../utilities/catchFun");
const error = require("./../utilities/error");

const appOptionController = require("./../controllers/appOptionController");
const authController = require("./../controllers/authController");
const queryHandler = require("./../handlers/queryHandler");
const imageHandler = require("./../handlers/imageHandler");

router.get("/bestSellingProducts" , queryHandler.validatePageNumber , catchAsync(async(req , res , next)=>{
    const options = {
        offset: req.offset,
        limit: req.limit,
        orderedBy:"purchased",
        descending:true,
        where:`quantity>0`
    };

    const products = await Product.select({productNameForSearch:false} , options);

    res.status(200).json(products);
}));
 
router.use("/appOption" , authController.authenticate , authController.allowedStatus("مفعل") , authController.permissionTo("مسؤول"));

router
    .route("/appOption")
    .get(appOptionController.getOption)
    .patch(imageHandler.uploadImage , appOptionController.editOption , imageHandler.resizeImage);

module.exports = router;
