const User = require("./../models/userModel");
const Cart = require("./../models/shoppingCartModel");
const Order = require("./../models/orderModel");

const error = require("./../utilities/error");
const {
  validatePassword,
  validatePasswordConfirm,
  validatePhoneNumber,
} = require("./../utilities/validation");
const { validateString } = require("./../utilities/validateUserProfile");
const { randomString, hashPassword } = require("./../utilities/myCrypto");
const { catchAsync } = require("./../utilities/catchFun");

const dumpCart = async (userId) => {
  await Cart.sql(
    `UPDATE carts INNER JOIN products ON products.productId=carts.productId SET products.addedToCart=products.addedToCart-carts.quantity WHERE carts.userId=${userId}`
  );

  await Cart.remove(`userId=${userId}`);
};

exports.createUser = catchAsync(async (req, res, next) => {
  const admin = req.user;
  const body = req.body;
  const cUserBody = {};
  const errors = [];

  if (body.type && admin[0].type == "مشرف" && body.type != "مستخدم")
    throw new error("ليس لديك صلاحيات إلا لإنشاء مستخدمين", 803, 403, true);

  // phoneNumber , password , passwordConfirm , type
  // createdAt , salt , passwordChanagedAt

  const isPhoneNumberValid = await validatePhoneNumber(body.phoneNumber);
  const isPasswordValid = await validatePassword(body.password);
  const isPasswordConfirmValid = await validatePasswordConfirm(
    body.password,
    body.passwordConfirm
  );

  if (isPhoneNumberValid instanceof Object) errors.push(isPhoneNumberValid);
  else {
    const user = await User.selectOne(
      { userId: true },
      { where: `phoneNumber="${body.phoneNumber}"` }
    );
    user.length > 0 &&
      errors.push({ fieldName: "phoneNumber", errMessage: "رقم غير متاح" });
  }

  isPasswordValid instanceof Object && errors.push(isPasswordValid);
  isPasswordConfirmValid instanceof Object &&
    errors.push(isPasswordConfirmValid);

  if (!body.type)
    errors.push({ fieldName: "type", errMessage: "نوع المستخدم مطلوب" });
  else if (!["مستخدم", "مشرف"].includes(body.type))
    errors.push({
      fieldName: "type",
      errMessage: `إما أن يكون نوع المستخدم (مشرف) أو (مستخدم). القيمة التي أدخلتها: ${body.type}`,
    });

  if (body.status) {
    if (!["مفعل", "غير مفعل", "محظور"].includes(body.status))
      errors.push({
        fieldName: "status",
        errMessage: `القيمة (${body.status}) غير صحيحة. القيم الصحيحة هي: (مفعل , محظور , غير مفعل)`,
      });
    cUserBody.status = body.status;
  }

  if (body.userName) {
    const isUserNameValid = validateString("userName", body.userName, 3, 40);
    console.log(isUserNameValid);
    (isUserNameValid instanceof Object && errors.push(isUserNameValid)) ||
      (cUserBody.userName = body.userName);
  }

  if (body.city) {
    const isCityValid = validateString("city", body.city, 2, 40);
    (isCityValid instanceof Object && errors.push(isCityValid)) ||
      (cUserBody.city = body.city);
  }

  if (body.position) {
    const isPositionValid = validateString("position", body.position, 2, 40);
    (isPositionValid instanceof Object && errors.push(isPositionValid)) ||
      (cUserBody.position = body.position);
  }

  if (body.nearsetPosition) {
    const isNearsetPositionValid = validateString(
      "nearsetPosition",
      body.nearsetPosition,
      2,
      100
    );
    (isNearsetPositionValid instanceof Object &&
      errors.push(isNearsetPositionValid)) ||
      (cUserBody.nearsetPosition = body.nearsetPosition);
  }

  if (body.gps) {
    const isGpsValid = validateString("gps", body.gps, 0, 300);
    (isGpsValid instanceof Object && errors.push(isGpsValid)) ||
      (cUserBody.gps = body.gps);
  }

  if (errors.length > 0) {
    throw new error(errors, 708, 400, true);
  }

  cUserBody.phoneNumber = body.phoneNumber;
  cUserBody.type = body.type;
  cUserBody.salt = randomString(128);
  cUserBody.password = await hashPassword(body.password, cUserBody.salt);
  cUserBody.createdAt = new Date();
  cUserBody.passwordChanagedAt = new Date();

  const user = await User.insertOne(cUserBody, {
    cols: "userId , userName , phoneNumber , createdAt , position , city , nearsetPosition , gps , status , type , image , currentOrders",
    where: `phoneNumber='${body.phoneNumber}'`,
  });

  if (req.file) {
    req.file.fileName = `users/${user[0].userId}_${randomString(
      10
    )}_${new Date().toISOStringV2().replace(/:/g, "-")}.${req.file.type}`;

    user[0].image = `/images/${req.file.fileName}`;

    res.status(201).json(user[0]);

    await User.update(
      { image: `/images/${req.file.fileName}` },
      `userId=${user[0].userId}`
    );

    return next();
  }
  res.status(201).json(user[0]);
});

exports.editUser = catchAsync(async (req, res, next) => {
  // from authenticate
  // users/:id
  const admin = req.user;
  const id = req.params.userId;
  const body = req.body;
  const errors = [];
  const editUserBody = {};
  // phoneNumber , password , status , type.
  const user = await User.selectOne(
    {},
    {
      where: `userId=${id} AND status<>"محذوف"`,
    }
  );

  if (user.length == 0)
    throw new error("لا يوجد مستخدم بهذا المُعرِف", 617, 404, true);

  if (
    user[0].type == "مسؤول" ||
    (user[0].type == "مشرف" && admin[0].type == "مشرف")
  )
    throw new error("لا يمكن تعديل بيانات هذا الحساب", 623, 403, true);

  if (body.phoneNumber) {
    const isPhoneNumberValid = await validatePhoneNumber(body.phoneNumber);
    if (isPhoneNumberValid instanceof Object) {
      errors.push(isPhoneNumberValid);
      editUserBody.phoneNumber = body.phoneNumber;
    } else {
      const user = await User.selectOne(
        { userId: true },
        { where: `phoneNumber="${body.phoneNumber}"` }
      );
      user.length > 0 &&
        errors.push({ fieldName: "phoneNumber", errMessage: "رقم غير متاح" });
    }
  }
  if (body.password) {
    const isPasswordValid = await validatePassword(body.password);
    isPasswordValid instanceof Object && errors.push(isPasswordValid);

    const isPasswordConfirmValid = await validatePasswordConfirm(
      body.password,
      body.passwordConfirm
    );
    isPasswordConfirmValid instanceof Object &&
      errors.push(isPasswordConfirmValid);

    editUserBody.salt = randomString(128);
    editUserBody.password = await hashPassword(
      body.password,
      editUserBody.salt
    );
  }

  if (body.type) {
    if (admin[0].type != "مسؤول")
      throw new error("ليس لديك الصلاحيات لتغييز نوع الحساب", 629, 403, true);
    if (!["مستخدم", "مشرف"].includes(body.type))
      errors.push({
        fieldName: "type",
        errMessage: `إما أن تكون القيمة المدخلة (مستخدم) أو (مشرف). القيمة التي أدخلتها ${body.type}`,
      });
    editUserBody.type = body.type;
  }

  if (body.status) {
    if (!["محظور", "غير مفعل", "مفعل"].includes(body.status))
      errors.push({
        fieldName: "status",
        errMessage: `إما أن تكون القيمة: (مفعل) أو (غير مفعل) أو (محظور). القيمة التي أدخلتها ${body.status}`,
      });
    editUserBody.status = body.status;
  }

  if (errors.length > 0) throw new error(errors, 499, 400, true);

  if (Object.keys(editUserBody).length == 0) return res.status(200).json();

  const newUser = await User.update(editUserBody, `userId=${id}`);

  const responseObj = {};

  editUserBody.status && (responseObj.status = newUser[0].status);
  editUserBody.type && (responseObj.type = newUser[0].type);
  editUserBody.phoneNumber &&
    (responseObj.phoneNumber = newUser[0].phoneNumber);

  res.status(200).json(responseObj);
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = req.user;
  const id = req.params.userId;

  if (user[0].type == "مستخدم") {
    if (id != user[0].userId)
      throw new error("ليس لديك صلاحية الحذف", 711, 403, true);

    const dUserBody = {
      deletedAt: new Date(),
      status: "محذوف",
    };

    await User.update(dUserBody, `userId=${id}`);

    await dumpCart(req.params.userId);

    res.clearCookie("token");
    return res.status(204).json();
  }

  const targetUser = await User.selectOne(
    {},
    { where: `userId=${id} AND status<>"محذوف"` }
  );

  if (targetUser.length == 0)
    throw new error("المستخدم غير موجود", 733, 400, true);

  if (targetUser[0].type == "مسؤول")
    throw new error("لا يمكن حذف هذا المستخدم", 917, 403, true);

  if (user[0].type == "مشرف") {
    if (targetUser[0].userId == user[0].userId) res.clearCookie("token");
    else if (targetUser[0].type != "مستخدم")
      throw new error("ليس لديك صلاحية لحذف هذا المستخدم", 738, 403, true);
  }
  const dUserBody = {
    deletedAt: new Date(),
    status: "محذوف",
    currentOrders: 0,
  };

  await User.update(dUserBody, `userId=${targetUser[0].userId}`);

  if (targetUser[0].type == "مستخدم") {
    // لو عندك طلب معلق او جار انجازه حيتم الغاءهن بالكامل
    await dumpCart(targetUser[0].userId);

    await Order.sql(
      `UPDATE orders o JOIN (SELECT orderId , productId , SUM(quantity) as requiredQuantity FROM orderedProducts WHERE orderId IN (SELECT orderId FROM orders WHERE userId=${req.params.userId}) GROUP BY productId ) as op ON o.orderId=op.orderId JOIN products p ON op.productId=p.productId SET p.quantity=p.quantity+op.requiredQuantity , p.purchased=p.purchased-op.requiredQuantity, o.status="ملغي" WHERE o.userId=${req.params.userId} AND o.status IN ("جارٍ الإنجاز" , "معلق")`
    );

    await Order.sql(
      `INSERT INTO orderedProductArchives SELECT * FROM orderedProducts WHERE orderId IN (SELECT orderId FROM orders WHERE userId=${req.params.userId} AND orders.status IN ("جارٍ الإنجاز" , "معلق"))`
    );

    await Order.sql(
      `DELETE op FROM orders as o JOIN orderedProducts as op ON o.orderId=op.orderId WHERE o.userId=${req.params.userId} AND o.status IN ("جارٍ الإنجاز" , "معلق")`
    );

    /* order ==> {
            update {
                orderedProduct (quantity , purchased) ==> products
                order ==> canceled
            }
            insert orderedProduct ==> orderedProductArchive
            delete orderedProduct
        }
        */
  }

  res.status(204).json();
});

exports.getUsers = catchAsync(async (req, res, next) => {
  const options = {
    limit: req.limit,
    offset: req.offset,
  };

  req.where && (options.where = req.where);

  const users = await User.select(
    {
      password: false,
      salt: false,
      passwordChanagedAt: false,
      vCode: false,
      vCodeExp: false,
      vCodeTimes: false,
      lastVCode: false,
      userNameForSearch: false,
    },
    options
  );

  res.status(200).json(users);
});

exports.getUser = catchAsync(async (req, res, next) => {
  if (
    req.user[0].userType == "مستخدم" &&
    req.user[0].userId != req.params.userId
  ) {
    throw new error("ليس لديك الصلاحية للولوج", 2500, 403, true, false);
  }
  const user = await User.selectOne(
    {
      password: false,
      salt: false,
      passwordChanagedAt: false,
      vCode: false,
      vCodeExp: false,
      vCodeTimes: false,
      lastVCode: false,
      userNameForSearch: false,
    },
    {
      where: `userId=${req.params.userId} AND status<>"محذوف"`,
    }
  );

  if (user.length == 0) throw new error("لا يوجد مستخدم بهذا المُعرِف");

  if (
    req.user[0].type == "مشرف" &&
    req.user[0].userId != user[0].userId &&
    user[0].type != "مستخدم"
  )
    return res.status(200).json({});

  res.status(200).json(user[0]);
});
