const {unlink} = require("fs/promises");

const User = require("./../models/userModel");
const Order = require("./../models/orderModel");

const error = require("./../utilities/error");
const {catchAsync} = require("./../utilities/catchFun");



exports.getDeletedUsers = catchAsync(async(req , res , next)=>{
    const options = {
        limit:req.limit,
        offset: req.offset,
        where:'status="محذوف"'
    };

    if(req.user[0].type == "مشرف")
        options.where += ' AND type="مستخدم"';
    
    const users = await User.select(
        {
            password:false,
            salt:false,
            passwordChanagedAt:false,
            vCode:false,
            vCodeExp:false,
            vCodeTimes:false,
            lastVCode:false
        },
        options
    );

    res.status(200).json(users);


});

exports.isDeletedUserExist = catchAsync(async(req , res , next)=>{
    const id = req.params.userId;
    let where = `userId=${id} AND status="محذوف"`;

    if(req.user[0].type == "مشرف")
        where += ' AND type="مستخدم"';

    const user = await User.selectOne({
        password:false,
        salt:false,
        passwordChanagedAt:false,
        vCode:false,
        vCodeExp:false,
        vCodeTimes:false,
        lastVCode:false
    }, {where});

    if(user.length == 0)
        throw new error("لا يوجد مستخدم بهذا المٌعرِف" , 1101 , 404 , true);

    req.deletedUser = user;
    next();
});

exports.getDeletedUser = catchAsync(async(req , res , next)=>{
    res.status(200).json(req.deletedUser[0]);
});

exports.permanentlyDelete = catchAsync(async(req , res , next)=>{
    
    await Order.sql(`UPDATE orders o JOIN (SELECT orderId , productId , SUM(quantity) as requiredQuantity FROM orderedProducts WHERE orderId IN (SELECT orderId FROM orders WHERE userId=${req.params.userId}) GROUP BY productId ) as op ON o.orderId=op.orderId JOIN products p ON op.productId=p.productId SET p.quantity=p.quantity+op.requiredQuantity , p.purchased=p.purchased-op.requiredQuantity, o.status="ملغي" WHERE o.userId=${req.params.userId} AND o.status IN ("جارٍ الإنجاز" , "معلق")`);

    await Order.sql(`INSERT INTO orderedProductArchives SELECT * FROM orderedProducts WHERE orderId IN (SELECT orderId FROM orders WHERE userId=${req.params.userId} AND orders.status IN ("جارٍ الإنجاز" , "معلق"))`);

    await Order.sql(`DELETE op , u FROM orders as o JOIN users as u ON u.userId=o.userId JOIN orderedProducts as op ON o.orderId=op.orderId WHERE o.userId=${req.params.userId} AND o.status IN ("جارٍ الإنجاز" , "معلق")`);


    res.status(204).json();
    // unlink
    if(req.deletedUser[0].image != "/images/users/noImage.png")
        await unlink(`public${req.deletedUser[0].image}`);
});

exports.retrievingDeletedUser = catchAsync(async(req ,res , next)=>{
    const status = req.body.status;
    if(!status)
        throw new error({fieldName:"status" , errMessage:"حقل مطلوب"} , 1102 , 400 , true);

    if(!["مفعل" , "غير مفعل" , "محظور"].includes(status))
        throw new error({fieldName:"status" , errMessage:`إما أن تكون القيمة: (مفعل) أو (غير مفعل) أو (محظور). القيمة التي أدخلتها ${status}`} , 1104 , 400 , true);

    await User.update({status , deletedAt:null} , `userId=${req.deletedUser[0].userId}`);

    res.status(200).json();
});