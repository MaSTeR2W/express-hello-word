
const router = require("express").Router();

const authController = require("./../controllers/authController");
const searchController = require("./../controllers/searchController");

const queryHandler = require("./../handlers/queryHandler")

router.get("/" , authController.authenticate , authController.allowedStatus("مفعل") , searchController.search , queryHandler.validatePageNumber , searchController.searchFor);

module.exports = router;

// هل نسيبوه للمسجيل فقط؟؟