const mysqlHandler = require("./../mysqlHandler-demo/mysqlHandler");

const rigthZeros = (dNumber) => {
  for (let i = 2; i < dNumber.length; i++) {
    if (dNumber[2] != 0) return false;
  }
  return true;
};

const productTable = {
  productId: {
    type: "number",
    dataType: "MEDIUMINT",
    unsigned: true,
    autoIncrement: true,
  },
  classId: {
    type: "number",
    dataType: "SMALLINT",
    unsigned: true,
  },
  productName: {
    type: "string",
    dataType: "VARCHAR(100)",
    maxLength: {
      length: 100,
      errMessage: "100 حرف هو الحد الأقصى لاسم المنتج",
    },
    trim: true,
    notNull: "حقل مطلوب",
  },
  productNameForSearch: {
    type: "string",
    dataType: "VARCHAR(100)",
    as: `(REPLACE(REPLACE(REPLACE(REPLACE(productName , "أ" , "ا") , "ي" , "ى") , "إ" , "ا") , "ة" , "ه"))`,
  },
  quantity: {
    type: "number",
    dataType: "MEDIUMINT",
    unsigned: true,
    default: 1,
    validate: (err, value) => {
      if (!Number.isInteger(Number(value)) || value < 0)
        err("يجب أن تكون الكمية عددا صحيحاً موجباً!");
    },
  },
  price: {
    type: "number",
    dataType: "FLOAT",
    unsigned: "يجب أن يكون للسعر قيمة موجبة",
    notNull: "حقل مطلوب",
    validate: (err, value) => {
      let dNum = value.toString().split(".")[1];
      if (!dNum) return;
      if (dNum.length > 2 && !rigthZeros(dNum))
        err(
          "صيغة العدد العشري غير صحيحة. يجب أن يكون العدد العشري: .25 أو .50 أو .75 أو .00"
        );

      dNum.length === 1 && (dNum = dNum + "0");

      if (!/([05][0]|[27][5])/.test(dNum) || dNum === "05")
        err(
          "صيغة العدد العشري غير صحيحة. يجب أن يكون العدد العشري: .25 أو .50 أو .75 أو .00"
        );
    },
  },
  oldPrice: {
    type: "number",
    dataType: "FLOAT",
    unsigned: "يجب أن تكون القيمة موجبة",
  },
  discountPercentage: {
    type: "number",
    dataType: "TINYINT",
    unsigned: "يجب أن تكون القيمة موجبة",
  },
  description: {
    type: "string",
    dataType: "VARCHAR(250)",
    default: "لا يوجد وصف",
    maxLength: {
      length: 250,
      errMessage: "250 حرفا هو أقصى طول للوصف",
    },
  },
  createdAt: {
    type: "date",
    dataType: "DATETIME",
    notNull: "حقل مطلوب",
  },
  deletedAt: {
    type: "date",
    dataType: "DATETIME",
  },
  atRunsOut: {
    type: "string",
    dataType: "VARCHAR(70)",
    trim: true,
    default: "نفذت الكمية",
    maxLength: {
      length: 70,
      errMessage: "70 حرفا هو الحد الاقصى لرسالة نفاذ الكمية",
    },
  },
  orderLimit: {
    type: "number",
    dataType: "SMALLINT",
    unsigned: "يجب أن يكون لحد الطلب قيمة صحيحة موجبة",
    default: 5,
    validate: (err, value) => {
      if (!Number.isInteger(value - 0)) err("يجب أن يكون لحد الطلب قيمة صحيحة");
    },
  },
  /*  image: {
    type: "string",
    dataType: "VARCHAR(70)",
    maxLength: {
      length: 70,
      errMessage: "70 حرف هو أقصى طول لمسار الصورة",
    },
    default: "/images/products/noImage.png",
  }, */
  purchased: {
    type: "number",
    dataType: "MEDIUMINT",
    unsigned: true,
    default: 0,
  },
  addedToCart: {
    type: "number",
    dataType: "MEDIUMINT",
    unsigned: true,
    default: 0,
  },
  status: {
    type: "string",
    dataType: "VARCHAR(6)",
    default: "موجود",
  },
  index: {
    indexers: [
      {
        iName: "productNameForSearchIndexer",
        iCol: "productNameForSearch",
        iType: "FULLTEXT",
      },
      {
        iName: "priceIndexer",
        iCol: "price",
      },
      {
        iName: "classIdIndexer",
        iCol: "classId",
      },
    ],
  },
  "PRIMARY KEY": {
    pKName: "productId",
  },
};

const Product = new mysqlHandler.createTable(productTable, "products");

module.exports = Product;
