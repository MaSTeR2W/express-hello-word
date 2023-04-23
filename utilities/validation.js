const error = require("./error");

exports.validateStringWithErrors = (
  fieldName,
  value,
  maxLength,
  minLength,
  errors
) => {
  if (typeof value != "string")
    errors.push({
      fieldName,
      errMessage: `يجب أن تكون البيانات من النوع string. نوع البيانات المدخل: ${typeof value}`,
    });
  else if (value.length > maxLength)
    errors.push({
      fieldName,
      errMessage: `يجب أن لا يتجاوز طول النص ${maxLength} حرفا`,
    });
  else if (value.length < minLength)
    errors.push({
      fieldName,
      errMessage: `يجب أن لا يقل طول النص عن ${minLength} حرفا`,
    });
};

exports.validatePassword = async (password) => {
  if (typeof password != "string")
    return {
      fieldName: "password",
      errMessage: `يجب أن تكون بيانات الحقل من النوع string وليس من النوع ${typeof password}`,
    };

  if (password.length < 8)
    return {
      fieldName: "password",
      errMessage: "الحد الأدنى لطول كلمة المرور هو 8 أحرف.",
    };

  if (password.length > 32)
    return {
      fieldName: "password",
      errMessage: "الحد الأقصى لطول كلمة المرور هو 32 حرفا.",
    };

  let strength = 0;

  if (/[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password)) strength++;

  if (/.*[A-Z].*/.test(password)) strength++;

  if (/.*[a-z].*/.test(password)) strength++;

  if (/.*\d+.*/.test(password)) strength++;

  if (strength < 2)
    return {
      fieldName: "password",
      errMessage: "كلمة المرور ضعيفة",
    };
};

exports.validatePasswordConfirm = async (password, passwordConfirm) => {
  if (typeof passwordConfirm != "string")
    return {
      fieldName: "passwordConfirm",
      errMessage: `يجب أن تكون بيانات الحقل من النوع string وليس من النوع ${typeof passwordConfirm}`,
    };

  if (password !== passwordConfirm)
    return {
      fieldName: "passwordConfirm",
      errMessage: "تأكيد كلمة غير صحيح",
    };
};

exports.validatePhoneNumber = async (phoneNumber) => {
  if (typeof phoneNumber != "string")
    return {
      fieldName: "phoneNumber",
      errMessage: `يجب أن يكون حقل كلمة المرور من النوع string وليس من النوع ${typeof passowrd}`,
    };

  if (phoneNumber.length != 10)
    return {
      fieldName: "phoneNumber",
      errMessage: "يجب أن يتكون رقم الهاتف من 10 أرقام",
    };

  if (!/^09[1245][0-9]+$/.test(phoneNumber))
    return {
      fieldName: "phoneNumber",
      errMessage: "صيغة رقم الهاتف غير صحيحة",
    };
};

const isExceededOrderLimit = async (product, quantity, checkLimit = true) => {
  if (!Number.isInteger(quantity - 0) || quantity < 1)
    return {
      fieldName: "qunatity",
      errMessage: `القيمة (${quantity}) غير صالحة`,
    };

  if (quantity > product.quantity)
    return {
      fieldName: "quantity",
      errMessage: `الكمية المطلوبة (${quantity}) أكثر من الكمية المتوفرة (${
        product.quantity || 0
      }).`,
    };

  if (checkLimit && quantity > product.orderLimit)
    return {
      fieldName: "quantity",
      errMessage: `تجاوز الحد الأقصى للطلب ${product.orderLimit}`,
    };
};

exports.isExceededOrderLimit = isExceededOrderLimit;

exports.isIntegerValid = (number, biggestValue, lowestValue, fieldName) => {
  if (!Number.isInteger(number - 0))
    return {
      fieldName,
      errMessage: `القيمة ${number} غير صالحة`,
    };

  if (number > biggestValue)
    return {
      fieldName,
      errMessage: `القيمة ${number} أكبر من ${biggestValue}.`,
    };

  if (number < lowestValue)
    return {
      fieldName,
      errMessage: `القيمة ${number} أصغر من ${lowestValue}`,
    };
};

exports.isIntegerValidWithError = (
  number,
  biggestValue,
  lowestValue,
  fieldName,
  errors
) => {
  if (!Number.isInteger(number))
    errors.push({
      fieldName,
      errMessage: `القيمة ${number} غير صالحة`,
    });
  else if (number > biggestValue)
    errors.push({
      fieldName,
      errMessage: `القيمة ${number} أكبر من ${biggestValue}.`,
    });
  else if (number < lowestValue)
    errors.push({
      fieldName,
      errMessage: `القيمة ${number} أصغر من ${lowestValue}`,
    });
};

exports.notificationValidator = (body, title, content) => {
  const notBody = {};
  const errors = [];
  if (body.title) {
    this.validateStringWithErrors("title", body.title, 100, 3, errors);
    notBody.title = body.title;
  } else {
    notBody.title = title;
  }

  if (body.content) {
    this.validateStringWithErrors("content", body.content, 200, 10, errors);
    notBody.content = body.content;
  } else {
    notBody.content = content;
  }

  if (errors.length > 0) throw new error(errors, 1287, 400, true);

  return notBody;
};
