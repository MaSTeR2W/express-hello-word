const router = require("express").Router();

const errLogController = require("./../controllers/errorController");
const queryHandler = require("./../handlers/queryHandler");

router.get("/" , queryHandler.validatePageNumber , errLogController.getErrors);

module.exports = router;