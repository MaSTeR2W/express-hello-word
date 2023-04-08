const jwt = require("jsonwebtoken");

const User = require("./../models/userModel");
const Visitor = require("./../models/visitorModel");
const {
  checkVCode,
  checkVCodeLimit,
  updateVCodeIPLimit,
} = require("./vCodeController");

const error = require("./../utilities/error");
const { catchAsync } = require("./../utilities/catchFun");
const {
  hashPassword,
  aesEncrypt,
  aesDecrypt,
  randomString,
} = require("./../utilities/myCrypto");
const {
  validatePassword,
  validatePasswordConfirm,
  validatePhoneNumber,
} = require("./../utilities/validation");

const cookieOps = {
  httpOnly: true,
};

const createVisitor = async (req, res) => {
  const createdAt = new Date().toISOStringV2().slice(0, 23).replace("T", " ");
  const lastVisit = new Date().toISOStringV2().slice(0, 23).replace("T", " ");
  const visitor = await Visitor.insertOne(
    { createdAt, lastVisit },
    { cols: "*", where: `createdAt="${createdAt}"` }
  );
  res.cookie("visitorId", visitor[0].visitorId);
  req.user[0].userId = visitor[0].visitorId;
};

const signToken = async (id, res) => {
  const token = jwt.sign(
    { id, iat: Date.now() / 1000 },
    process.env.JWT_SECRET
  );
  res.cookie("token", await aesEncrypt(token), cookieOps);
  return;
};

exports.isClosed = catchAsync(async (req, res, next) => {
  console.log("protocol is:" + req.secure);
  console.log(req.body);

  if (ApplicationOption.shopStatus != "مغلق") return next();

  if (req.path == "/registration/login") return next();

  const token = req.cookies.token;

  if (!token) throw new error("المتجر مغلق حاليا!", 1237, 503, true);

  const decoded = jwt.verify(await aesDecrypt(token), process.env.JWT_SECRET);

  const isAdmin = await User.sql(
    `SELECT (type="مسؤول" OR type="مشرف") as allowed FROM users WHERE userId=${decoded.id}`
  );

  if (isAdmin.length > 0 && isAdmin[0].allowed) return next();

  throw new error("المتجر مغلق حاليا!", 1237, 503, true);
});

exports.login = catchAsync(async (req, res, next) => {
  const nullFields = [];
  const body = req.body;

  body.phoneNumber ||
    nullFields.push({
      fieldName: "phoneNumber",
      errMessage: "حقل مطلوب",
    });
  body.password ||
    nullFields.push({
      fieldName: "password",
      errMessage: "حقل مطلوب",
    });

  if (nullFields.length > 0) {
    throw new error(nullFields, 100, 400, true);
  }

  const user = await User.selectOne(
    {},
    {
      where: `phoneNumber="${body.phoneNumber}" AND status<>"محذوف"`,
    }
  );
  const errMessage = [
    {
      fieldName: "phoneNumber",
      errMessage: "رقم الهاتف أو كلمة المرور غير صحيح",
    },
    {
      fieldName: "password",
      errMessage: "رقم الهاتف أو كلمة المرور غير صحيح",
    },
  ];
  if (user.length == 0) throw new error(errMessage, 107, 400, true);

  const password = await hashPassword(body.password, user[0].salt);

  if (password != user[0].password) throw new error(errMessage, 108, 400, true);

  if (user[0].status != "نشط") {
    if (user[0].status == "محظور")
      throw new error("حسابك محظور", 109, 401, true);
    // في حال الحساب مش مفعل
    else if (user[0].status == "غير مفعل") {
      // حساب غير مفعل
      await signToken(user[0].phoneNumber, res);
      throw new error("حسابك غير مفعل", 127, 405, true);
    }
  }

  await signToken(user[0].userId, res);

  res.status(200).json({
    userId: user[0].userId,
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  res.clearCookie("token");
  res.status(200).json();
});

exports.signup = catchAsync(async (req, res, next) => {
  const body = req.body;
  const errors = [];
  const signupBody = {};
  let overWrite = false;

  const isPasswordValid = await validatePassword(body.password);
  const isPasswordConfirmValid = await validatePasswordConfirm(
    body.password,
    body.passwordConfirm
  );

  isPasswordValid instanceof Object && errors.push(isPasswordValid);
  isPasswordConfirmValid instanceof Object &&
    errors.push(isPasswordConfirmValid);

  if (!body.phoneNumber) {
    errors.push({
      fieldName: "phoneNumber",
      errMessage: "رقم الهاتف مطلوب",
    });
  } else {
    const isPhoneNumberValid = await validatePhoneNumber(body.phoneNumber);

    if (isPhoneNumberValid instanceof Object) {
      errors.push(isPhoneNumberValid);
    } else {
      const preUser = await User.selectOne(
        {},
        {
          where: `phoneNumber="${body.phoneNumber}"`,
        }
      );

      if (preUser.length > 0) {
        if (preUser[0].status != "غير مفعل" && preUser[0].status != "محذوف") {
          errors.push({
            fieldName: "phoneNumber",
            errMessage: "هذا الرقم غير متاح.",
          });
        } else {
          overWrite = true;
          await checkVCodeLimit(preUser, signupBody, req);
        }
      } else {
        await updateVCodeIPLimit(req);
      }
    }
  }

  if (errors.length > 0) throw new error(errors, 527, 400, true);

  signupBody.salt = randomString(128);
  signupBody.createdAt = new Date(Date.now() + 1000);
  signupBody.vCode = randomString(10, true);
  signupBody.vCodeExp = new Date(Date.now() + 1000 * 61 * 5);
  signupBody.lastVCode = new Date(Date.now() + 1000);

  signupBody.password = await hashPassword(body.password, signupBody.salt);

  let user;
  if (overWrite) {
    signupBody.status = "غير مفعل";
    signupBody.type = "مستخدم";
    user = await User.update(signupBody, `phoneNumber='${body.phoneNumber}'`);
  } else {
    signupBody.phoneNumber = body.phoneNumber;
    user = await User.insertOne(signupBody, {
      cols: "userId , phoneNumber",
      where: `phoneNumber='${body.phoneNumber}'`,
    });
  }

  // send vCode message
  console.log(signupBody.vCode);
  // cookie
  await signToken(user[0].phoneNumber, res);

  res.status(201).json();
});

exports.isLogedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.token) return next();

  req.user = [{ type: "زائر", status: "مفعل" }];
  const visitorId = req.cookies.visitorId;

  if (!visitorId) {
    await createVisitor(req, res);
  } else if (visitorId) {
    const visitor = await Visitor.selectOne(
      {},
      { where: `visitorId=${visitorId}` }
    );

    if (visitor.length == 0) await createVisitor(req, res);
    else {
      Visitor.update(
        {
          lastVist: new Date().toISOStringV2().slice(0, 23).replace("T", " "),
        },
        `visitorId=${visitorId}`
      );

      req.user[0].userId = visitor[0].visitorId;
    }
  }

  next();
});

exports.authenticate = catchAsync(async (req, res, next) => {
  if (req.user && req.user[0].type == "زائر") return next();

  const cookies = req.cookies;

  if (!cookies.token) throw new error("الرمز مفقود", 201, 401, true);

  const decoded = jwt.verify(
    await aesDecrypt(cookies.token),
    process.env.JWT_SECRET
  );

  const user = await User.selectOne(
    {},
    {
      where: `userId=${decoded.id}  AND status<>"محذوف"`,
    }
  );

  if (user.length == 0) throw new error("رمز مجهول التبعية", 207, 401, true);

  if (
    user[0].passwordChanagedAt &&
    user[0].passwordChanagedAt.toISOString() >
      new Date(decoded.iat * 1000).toISOStringV2()
  )
    throw new error(
      "تم تغيير كلمة المرور. يرجى إعادة تسجيل الدخول",
      301,
      401,
      true
    );

  req.user = user;
  next();
});

exports.registrationAuthentication = catchAsync(async (req, res, next) => {
  const cookies = req.cookies;

  if (!cookies.token) throw new error("الرمز مفقود", 201, 401, true);

  const decoded = jwt.verify(
    await aesDecrypt(cookies.token),
    process.env.JWT_SECRET
  );
  console.log(decoded);
  const user = await User.selectOne("", {
    where: `phoneNumber=${decoded.id}`,
  });

  if (user.length == 0) throw new error("رمز مجهول التبعية", 207, 401, true);

  req.user = user;
  next();
});

exports.allowedStatus = (status) => {
  return catchAsync(async (req, res, next) => {
    if (req.user[0].status != status)
      throw new error(`الحساب ${req.user[0].status}`, 127, 403, true);
    next();
  });
};

exports.permissionTo = (...type) => {
  return catchAsync(async (req, res, next) => {
    if (!type.includes(req.user[0].type))
      throw new error("ليس لديك الصلاحية للولوج", 170, 403, true);
    next();
  });
};

exports.verifyCode = catchAsync(async (req, res, next) => {
  checkVCode(req.user, req.body);

  const user = await User.update(
    {
      status: "مفعل",
    },
    `userId=${req.user[0].userId}`
  );

  await signToken(user[0].userId, res);
  res.status(200).json({
    userId: user[0].userId,
  });
});

exports.regenerateVCode = catchAsync(async (req, res, next) => {
  const user = req.user;
  const body = {};

  body.lastVCode = new Date();
  body.vCode = randomString(10);
  body.vCodeExp = new Date(Date.now() + 1000 * 60 * 5);

  await checkVCodeLimit(user, body, req);

  await User.update(body, `userId=${user[0].userId}`);

  res.status(200).json();
});

// reset password

exports.resetPassword1st = catchAsync(async (req, res, next) => {
  const body = req.body;

  const isPhoneNumberValid = await validatePhoneNumber(body.phoneNumber);

  if (isPhoneNumberValid instanceof Object)
    throw new error(isPhoneNumberValid, 367, 400, true);

  const user = await User.selectOne("", {
    where: `phoneNumber="${body.phoneNumber}"`,
  });

  if (user.length == 0)
    throw new error(
      {
        fieldName: "phoneNumber",
        errMessage: "لا يوجد مستخدم لهذا الرقم",
      },
      355,
      400,
      true
    );

  if (user[0].status != "مفعل")
    throw new error(`حساب ${user[0].status}`, 127, 405, true);

  const rePassBody = {
    vCode: randomString(10),
    vCodeExp: new Date(Date.now() + 1000 * 60 * 5),
    lastVCode: new Date(),
  };

  await checkVCodeLimit(user, rePassBody, req);

  // send vCode

  console.log(rePassBody);

  await User.update(rePassBody, `userId=${user[0].userId}`);

  await signToken(body.phoneNumber, res);

  res.status(200).json();
});

exports.resetPassword2nd = catchAsync(async (req, res, next) => {
  const errors = [];
  const user = req.user;

  try {
    checkVCode(user, req.body);
  } catch (err) {
    errors.push(err.errMessage);
  }

  const rePassBody = {
    password: req.body.password,
  };

  const isPasswordValid = await validatePassword(rePassBody.password);
  const isPasswordConfirmValid = await validatePasswordConfirm(
    rePassBody.password,
    req.body.passwordConfirm
  );

  isPasswordValid instanceof Object && errors.push(isPasswordValid);
  isPasswordConfirmValid instanceof Object &&
    errors.push(isPasswordConfirmValid);

  if (errors.length > 0) throw new error(errors, 378, 400, true);

  rePassBody.salt = randomString(128);

  rePassBody.password = await hashPassword(
    rePassBody.password,
    rePassBody.salt
  );

  rePassBody.passwordChanagedAt = new Date();

  rePassBody.vCode = "NULL";

  await User.update(rePassBody, `userId=${user[0].userId}`);

  res.clearCookie("token");

  res.status(200).json();
});

const deleteOldVisitors = async () => {
  const now = new Date();
  now.setDate(now.getDate() - 6);
  await Visitor.sql(
    `DELETE V , N FROM visitors as V LEFT JOIN notifications as N ON V.visitorId=N.userId AND N.type="للزائر" WHERE V.lastVisit<"${now
      .toISOStringV2()
      .slice(0, 23)
      .replace("T", " ")}"`
  );
  setTimeout(deleteOldVisitors, 1000 * 60 * 60 * 24);
};

deleteOldVisitors();
