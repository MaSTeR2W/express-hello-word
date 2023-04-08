const Cart = require("./../models/shoppingCartModel");
const Order = require("./../models/orderModel");
const OrderedProduct = require("./../models/orderedProduct");
const OrderedProductArchive = require("./../models/orderedProductArchive");
const User = require("./../models/userModel");
const Product = require("./../models/productModel");
const Not = require("./../models/notificationModel");
const Image = require("./../models/imageModel");

const { catchAsync } = require("./../utilities/catchFun");
const error = require("./../utilities/error");
const { getType } = require("./../utilities/auxiliaryFunctions");
const { hashPassword } = require("./../utilities/myCrypto");

const orders = [];

const { isExceededOrderLimit } = require("./../utilities/validation");
/* const isExceededOrderLimit = async(product , quantity)=>{

    if(quantity > product.quantity)
        return {
            fieldName:"quantity",
            errMessage:`الكمية المطلوبة (${quantity}) أكثر من الكمية المتوفرة (${product.quantity}).`
        };

    if(quantity > product.orderLimit)
        return {
            fieldName:"quantity",
            errMessage:`للأسف لقد تم تعديل الحد الأقصى للطلب ${product.orderLimit} يرجى تعديل الكمية لمتابعة عملية الشراء.`
        };
}; */

const resetProductsQuantity = async (order) => {
  const idCases = [];
  const products = order[0].orderedProducts;
  const purchased = [];
  const ids = [];

  for (let i = 0; i < products.length; i++) {
    ids.push(products[i].productId);
    idCases.push(
      `WHEN ${products[i].productId} THEN quantity+${products[i].requiredQuantity}`
    );
    purchased.push(
      `WHEN ${products[i].productId} THEN purchased-${products[i].requiredQuantity}`
    );
  }

  await Product.sql(
    `UPDATE products SET quantity=CASE productId ${idCases.join(
      " "
    )} END , purchased=CASE productId ${purchased.join(
      " "
    )} END WHERE productId IN (${ids})`
  );
};
// Criticat Section

const createOrder = function (req, res, next) {
  return async function () {
    if (req.user[0].currentOrders >= ApplicationOption.maximumOrdersPerUser) {
      next(new error("لقد وصلت إلى الحد الأقصى لعدد الطلبات", 1149, 405, true));
      return orders.pop();
    }

    const userId = req.user[0].userId;

    const productsCart = await Cart.sql(
      `SELECT carts.productId , carts.quantity as requiredQuantity , products.quantity as quantity , orderLimit , status , productName , price , addedToCart , purchased FROM carts INNER JOIN products ON carts.productId=products.productId where carts.userId=${userId}`
    );

    if (productsCart.length == 0) {
      next(new error("السلة فارغة", 1141, 400, true));
      return orders.pop();
    }

    const errors = [];

    for (let i = 0; i < productsCart.length; i++) {
      if (productsCart[i].status == "محذوف") {
        errors.push({
          fieldName: "status",
          errMessage: `العنصر (${productsCart[i].productName}) تم حذفه`,
          productId: productsCart[i].productId,
        });
        continue;
      }
      const validateQuantity = await isExceededOrderLimit(
        productsCart[i],
        productsCart[i].requiredQuantity,
        false
      );
      if (validateQuantity instanceof Object) {
        validateQuantity.productId = productsCart[i].productId;
        errors.push(validateQuantity);
      }
    }

    if (errors.length > 0) {
      next(new error(errors, 1143, 405, true));
      return orders.pop();
    }

    const order = await Order.insertOne(
      {
        userId,
        status: "معلق",
        orderedAt: new Date(),
      },
      {
        cols: "orderId",
        where: `userId=${userId} AND orderedAt="${new Date()
          .toISOStringV2()
          .slice(0, 19)
          .replace("T", " ")}"`,
      }
    );

    const values = [];
    const updatePurchased = [];
    const updateAddedToCart = [];
    const productsIds = [];
    const updateQuantity = [];

    for (let i = 0; i < productsCart.length; i++) {
      const id = productsCart[i].productId;
      const requiredQuantity = productsCart[i].requiredQuantity;

      values.push(
        `(${order[0].orderId} , ${id} , ${productsCart[i].price} , ${requiredQuantity} , quantity*price)`
      );

      productsIds.push(id);

      updatePurchased.push(`WHEN ${id} THEN purchased+${requiredQuantity}`);
      updateAddedToCart.push(`WHEN ${id} THEN addedToCart-${requiredQuantity}`);
      updateQuantity.push(`WHEN ${id} THEN quantity-${requiredQuantity}`);
    }
    const title = "يوجد طلب جديد";
    const content = `لقد قام مستخدم بطلب بعض المنتجات
        رقم هاتف المستخدم: ${req.user[0].phoneNumber}
        المدينة: ${req.user[0].city}  المنطقة: ${req.user[0].position}`;

    const now = new Date().toISOStringV2().slice(0, 19).replace("T", " ");

    await Promise.all([
      OrderedProduct.sql(
        `INSERT INTO orderedProducts (orderId , productId , price , quantity , totalPrice) Values ${values}`
      ),

      OrderedProduct.sql(
        `UPDATE products SET addedToCart= CASE productId ${updateAddedToCart.join(
          " "
        )} ELSE addedToCart END , purchased= CASE productId ${updatePurchased.join(
          " "
        )} ELSE purchased END , quantity= CASE productId ${updateQuantity.join(
          " "
        )} ELSE quantity END WHERE productId IN (${productsIds})`
      ),

      await User.sql(
        `UPDATE users SET currentOrders=currentOrders+1 WHERE userId=${userId}`
      ),
      /* User.update({currentOrders:++req.user[0].currentOrders} , `userId=${userId}`), */

      Cart.remove(`userId=${userId}`),

      Not.sql(
        `INSERT INTO notifications (userId , title , content , createdAt , status , type) SELECT userId , "${title}" , "${content}" , "${now}" , "جديد" , "للإدارة" FROM users WHERE users.status="مفعل" AND users.type<>"مستخدم"`
      ),
    ]);

    res.status(200).json(order[0]);
    return orders.pop();
  };
};

exports.addCreateOrder = catchAsync(async (req, res, next) => {
  orders.unshift(createOrder(req, res, next));

  if (orders.length != 1) return;

  while (orders.length > 0) await orders[orders.length - 1]();
});

// Criticat Section

exports.isOrderExist = catchAsync(async (req, res, next) => {
  const order = await Order.sql(
    `SELECT orderId , A.userId , orderedAt , A.status as orderStatus , userName , phoneNumber , image , city , position , nearestPosition , gps , B.status as userStatus, type , currentOrders FROM orders as A INNER JOIN users as B ON A.userId=B.userId WHERE A.orderId=${req.params.orderId}`
  );

  if (order.length == 0)
    throw new error("لا يوجد طلب بهذا المُعرِف", 1147, 404, true);

  const user = req.user;

  if (user[0].type == "مستخدم" && order[0].userId != user[0].userId)
    throw new error("ليس لديك صلاحية للولوج", 1179, 403, true);

  const userId = req.user[0].userId;
  const type = req.user[0].type;
  const order_userId = order[0].userId;

  if (type == "مستخدم" && order_userId != userId)
    throw new error("ليس لديك الصلاحية للولوج", 1163, 403, true);

  if (type == "مشرف" && order[0].type != "مستخدم" && userId != order_userId)
    throw new error("ليس لديك الصلاحية للولوج", 1165, 403, true);

  const orderedProducts = await OrderedProduct.sql(
    `SELECT A.productId , A.price , A.quantity as requiredQuantity , totalPrice , productName , B.price as currentPrice , oldPrice , discountPercentage , status FROM orderedProducts as A LEFT JOIN products as B ON A.productId=B.productId where A.orderId=${req.params.orderId}`
  );

  order[0].orderedProducts = orderedProducts;

  req.order = order;
  next();
});

exports.getOrder = catchAsync(async (req, res, next) => {
  const products = req.order[0].orderedProducts;
  if (products.length > 0) {
    const images = await Image.select(
      {},
      { where: `productId IN (${products.map((el) => el.productId)})` }
    );

    const idsOfProducts = [];
    for (let i = 0; i < products.length; i++) {
      products[i].images = [];
      idsOfProducts.push(products[i].productId);
    }

    while (images.length > 0) {
      products[idsOfProducts.indexOf(images[0].productId)].images.push(
        images.shift()
      );
    }
  }
  res.status(200).json(req.order[0]);
});

exports.getOrders = catchAsync(async (req, res, next) => {
  // status , userId , month , day , year
  const options = {
    limit: req.limit,
    offset: req.offset,
  };

  req.where.length > 0 && (options.where = req.where.join(" AND "));

  const orders = await Order.sql(
    `SELECT orders.orderId , orders.userId , orders.status as orderStatus , orderedAt , archivedAt , userName , phoneNumber , users.status as userStatus , image as userImage , city , position , nearestPosition , gps , currentOrders FROM orders LEFT JOIN users ON orders.userId=users.userId ${
      options.where ? `WHERE ${options.where}` : ""
    } order by orderId LIMIT ${options.limit} OFFSET ${options.offset}`
  );

  /*     if(orders.length == 0)
        return res.status(200).json(orders); */

  /* const ordersIds = [];
    const arOrdersIds = [];
    const arr = ["مُنجز" , "ملغي"];
    for(let i = 0 ; i < orders.length ; i++){
        arr.includes(orders[i].orderStatus)? arOrdersIds.push(orders[i].orderId):ordersIds.push(orders[i].orderId);
    };
    let sql = "";

    if(arOrdersIds.length > 0 && ordersIds.length > 0){
        sql = `SELECT A.orderId , A.productId , A.price , A.quantity as requiredQuantity , totalPrice , productName , image , status FROM (SELECT orderId , productId , price , quantity , totalPrice FROM orderedProducts WHERE orderId IN (${ordersIds}) UNION SELECT orderId , productId , price , quantity , totalPrice FROM orderedProductArchives where orderId IN (${arOrdersIds})) as A LEFT JOIN products as B ON A.productId=B.productId order by orderId`;

    }else if(ordersIds.length > 0 && arOrdersIds.length == 0){
        sql = `SELECT orderId , A.productId , A.price , A.quantity as requiredQuantity , totalPrice , productName , image , status FROM orderedProducts as A LEFT JOIN products as B ON A.productId=B.productId WHERE orderId IN (${ordersIds}) order by orderId`;
    }else{
        sql = `SELECT orderId , A.productId , A.price , A.quantity as requiredQuantity , totalPrice , productName , image , status FROM orderedProductArchives as A LEFT JOIN products as B ON A.productId=B.productId WHERE orderId IN (${arOrdersIds}) order by orderId`;
    };
    const orderedProducts = await OrderedProduct.sql(sql);

    let j = 0;
    for(let i = 0 ; i < orders.length ; i++){
        const oProducts = [];
        while(j < orderedProducts.length){
            if(orders[i].orderId == orderedProducts[j].orderId)
                oProducts.push(orderedProducts[j]);
            else
                break;
            j++;
        };
        orders[i].orderedProducts = oProducts;
    }; */

  res.status(200).json(orders);
});

exports.editOrder = catchAsync(async (req, res, next) => {
  // status
  const order = req.order;
  const status = req.body.status;
  if (!status) {
    delete order[0].orderedProducts;
    delete order[0].type;
    delete order[0].userStatus;
    return res.status(200).json(order[0]);
  }

  if (!["معلق", "جارٍ الإنجاز", "ملغي", "مُنجز"].includes(status))
    throw new error({
      fieldName: "status",
      errMessage: `القيمة ${status} غير صالحة. `,
    });

  if (status == order[0].orderStatus) {
    delete order[0].orderedProducts;
    delete order[0].type;
    delete order[0].userStatus;
    return res.status(200).json(order[0]);
  }

  // =======================================
  // أسأل الشباب

  if (["مُنجز", "ملغي"].includes(order[0].orderStatus))
    throw new error(
      "لا يمكن تعديل الطلبات المنجزة أو الملغية",
      1165,
      405,
      true
    );

  // ======================================

  if (status == "مُنجز" || status == "ملغي") {
    await OrderedProductArchive.sql(
      `INSERT INTO orderedProductArchives SELECT * FROM orderedProducts WHERE orderId=${order[0].orderId}`
    );

    if (status == "ملغي") {
      await resetProductsQuantity(order);
    }

    await OrderedProduct.remove(`orderId=${order[0].orderId}`);

    await User.sql(
      `UPDATE users SET currentOrders=currentOrders-1 WHERE userId=${order[0].userId}`
    );
  }

  const newOrder = await Order.update(
    { status },
    `orderId=${order[0].orderId}`,
    { cols: "*", where: `orderId=${order[0].orderId}` }
  );

  res.status(200).json(newOrder[0]);
  // معلق ==>> ملغي ,منجز , جار الانجاز
  // جار الانجاز ==>> ملغي , معلق , منجز
});

exports.deleteOrder = catchAsync(async (req, res, next) => {
  const done = ["مُنجز", "ملغي"].includes(req.order[0].orderStatus);

  if (!done) {
    await resetProductsQuantity(req.order);
    await User.sql(
      `UPDATE users SET currentOrders=currentOrders-1 WHERE userId=${req.order[0].userId}`
    );
  }

  const tableName = done ? "orderedProductArchives" : "orderedProducts";

  await Order.sql(
    `DELETE orders , ${tableName} FROM orders , ${tableName} WHERE orders.orderId=${tableName}.orderId AND orders.orderId=${req.order[0].orderId}`
  );

  res.status(204).json();
});

exports.deleteOrders = catchAsync(async (req, res, next) => {
  // month year day , orderId array .
  // heavy process
  // هنا يتم التعامل فقط مع الطلبات المؤرشفة
  const password = req.body.password;

  if (
    !password ||
    (await hashPassword(password, req.user[0].salt)) !== req.user[0].password
  )
    throw new error("كلمة المرور غير صحيحة", 1214, 401, true);
  if (!req.where) {
    const ordersIds = req.body.ordersIds;

    if (getType(ordersIds) != "array")
      throw new error(
        {
          fieldName: "ordersIds",
          errMessage: `يجب أن تكون البيانات من النوع array وليس من النوع ${getType(
            ordersIds
          )}`,
        },
        1174,
        400,
        true
      );

    const errors = [];

    for (let i = 0; i < ordersIds.length; i++)
      if (!Number.isInteger(ordersIds[i] - 0))
        errors.push({
          fieldName: "ordersIds",
          errMessage: `قيمة الفهرس ${i} في المصفوفة غير صالح (${ordersIds[i]}).`,
        });

    if (errors.length > 0) throw new error(errors, 1181, 400, true);

    req.where = `A.orderId IN (${ordersIds.join(",")})`;
  }

  await Order.sql(
    `DELETE A , B FROM orders as A LEFT JOIN orderedProductArchives as B ON A.orderId=B.orderId WHERE ${req.where} AND A.status IN ("مُنجز" , "ملغي");`
  );

  res.status(204).json();
});
