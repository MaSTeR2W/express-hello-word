const { unlink } = require("fs/promises");

const AppOption = require("./../models/applicationOption");

const { catchAsync } = require("./../utilities/catchFun");
const error = require("./../utilities/error");
const { isIntegerValidWithError } = require("./../utilities/validation");
const { randomString } = require("./../utilities/myCrypto");

exports.getOption = catchAsync(async (req, res, next) => {
  const option = await AppOption.selectOne({});
  res.status(200).json(option);
});

exports.editOption = catchAsync(async (req, res, next) => {
  const body = req.body;
  const eOBody = {};
  const errors = [];

  if (body.maximumCartItems) {
    isIntegerValidWithError(
      body.maximumCartItems,
      10000,
      1,
      "maximumCartItems",
      errors
    );
    eOBody.maximumCartItems = body.maximumCartItems;
  }

  if (body.maximumOrdersPerUser) {
    isIntegerValidWithError(
      body.maximumOrdersPerUser,
      10000,
      1,
      ",maximumOrdersPerUser",
      errors
    );
    eOBody.maximumOrdersPerUser = body.maximumOrdersPerUser;
  }

  if (body.shopStatus) {
    if (typeof body.shopStatus != "string")
      errors.push({
        fieldName: "shopStatus",
        errMessage: `نوع البيانات ${body.shopStatus} غير صحيح`,
      });

    if (!["مغلق", "مفتوح"].includes(body.shopStatus))
      errors.push({
        fieldName: "shopStatus",
        errMessage: `القيمة ${body.shopStatus} غير صالحة يجب أن تكون القيمة إما مغلق أو مفتوح`,
      });

    eOBody.shopStatus = body.shopStatus;
  }

  if (body.dailyMessageLimit) {
    isIntegerValidWithError(
      body.dailyMessageLimit,
      25,
      1,
      "dailyMessage",
      errors
    );
    eOBody.dailyMessageLimit = body.dailyMessageLimit;
  }

  if (body.monthlyMessageLimit) {
    isIntegerValidWithError(
      body.monthlyMessageLimit,
      1000,
      1,
      "monthlyMessage",
      errors
    );
    eOBody.monthlyMessageLimit = body.monthlyMessageLimit;
  }

  if (errors.length > 0) throw new error(errors, 1225, 400, true);

  if (req.file) {
    req.file.fileName = `${randomString(10)}_${new Date()
      .toISOStringV2()
      .replace(/:/g, "-")}.${req.file.type}`;
    eOBody.logo = `/images/${req.file.fileName}`;
  }

  if (Object.keys(eOBody).length == 0)
    return res.status(200).json(ApplicationOption);

  const path = `public${ApplicationOption.logo}`;
  global.ApplicationOption = (await AppOption.update(eOBody, `optionId=1`))[0];

  res.status(200).json(ApplicationOption);

  req.file && ApplicationOption.logo && unlink(path) && next();
});
