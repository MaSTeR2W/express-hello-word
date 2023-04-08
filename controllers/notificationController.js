const Not = require("./../models/notificationModel");


const {catchAsync} = require("./../utilities/catchFun");
const error = require("./../utilities/error");

exports.getNotifications = catchAsync(async(req , res , next)=>{
    const type = req.user[0].type == "مستخدم"? "للمستخدم": req.user[0].type == "زائر"? "للزائر" : "للإدارة";
    const status = req.query.status || "جديد";

    if(!["أُرسل" , "جديد"].includes(status))
        throw new error({queryProperty:"status" , errMessage:`القيمة ${status} غير صالحة`} , 1290 , 400 , true);

    const nots = await Not.sql(`SELECT title , content , n.productId , productName , quantity , price , IF(p.image , p.image , c.image) as image , discountPercentage , oldPrice , p.classId , description , atRunsOut , orderLimit , purchased , addedToCart , p.status as productStatus , IF(p.createdAt , p.createdAt , c.createdAt) as createdAt , IF(p.deletedAt , p.deletedAt , c.deletedAt) as deletedAt , className , numberOfProducts , IF(p.status , p.status , c.status) as status FROM notifications as n LEFT JOIN products as p ON n.productId=p.productId LEFT JOIN classifications as c ON n.classId=c.classId WHERE userId=${req.user[0].userId} AND type="${type}" AND n.status="${status}"`);

    /* const nots = await Not.select({type:false , status:false} , {where:`userId=${req.user[0].userId} AND type="${type}" AND status="${status}"`}); */

    if(nots.length > 0)
        await Not.update({
            status: "أُرسل"
        } , `userId=${req.user[0].userId}` , false);

    res.status(200).json(nots);
});

exports.createNotification = catchAsync(async(req , res , next)=>{
    const title = req.body.title;
    const content = req.body.content;
    const errors = [];
    if(typeof title != "string" || title.length > 100)
        errors.push({fieldName:"title" , errMessage:"إما أن يكون نوع البيانات غير صحيح أو أن العنوان طويل جداً"});

    if(typeof content != "string" || content.length > 200)
        errors.push({fieldName:"content" , errMessage:"إما أن يكون نوع البيانات غير صحيح أو أن نص الإشعار طويل جداً"});

    if(errors.length > 0)
        throw new error(errors , 1213 , 400 , true);

    const createdAt = new Date().toISOStringV2().slice(0,19).replace("T" , " ");
    
    await Not.sql(`INSERT INTO notifications (userId , title , content , createdAt , type , status) (SELECT userId , "${title}" , "${content}" , "${createdAt}" , "للمستخدم" , "جديد" FROM users WHERE users.status="مفعل" AND users.type="مستخدم" UNION SELECT visitorId as userId , "${title}" , "${content}" , "${createdAt}" , "للزائر" , "جديد" FROM visitors)`);

    res.status(201).json();
    
});

const deleteOldNotification = ()=>{
    
    const date = new Date();
    const day = date.getDate();
    const now = new Date(`${date.getFullYear()}-${date.getMonth()-0+1}-${day}`);

    now.setDate(day-6);

    Not.remove(`createdAt<"${now.getAntiISODate()} 00:00:00"`);
    console.log(`createdAt<"${now.getAntiISODate()} 00:00:00"`);

    setTimeout(deleteOldNotification , 1000 * 60 * 60 * 24);
};

deleteOldNotification();

setTimeout(deleteOldNotification , 1000 * 60 * 60 * 24);


