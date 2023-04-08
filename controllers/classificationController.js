const {unlink} = require("fs/promises");
const Class = require("./../models/classificationModel");
const Product = require("./../models/productModel");


const {catchAsync} = require("./../utilities/catchFun");
const {randomString} = require("./../utilities/myCrypto");
const error = require("./../utilities/error");
const {notificationValidator} = require("./../utilities/validation");
const rigthZeros = (dNumber)=>{
    for(let i = 2 ; i < dNumber.length ; i++){
        if(dNumber[2] != 0) return false;
    }
    return true;
};

exports.createClass = catchAsync(async(req , res , next)=>{
    const cClassBody = {
        className: req.body.className,
        createdAt: new Date()
    };

    if(req.file){
        req.file.fileName = `classifications/${randomString(10)}_${new Date().toISOStringV2().replace(/:/g , "-")}.${req.file.type}`;
        cClassBody.image = `/images/${req.file.fileName}`;
    };
    console.log(cClassBody);
    const newClass = await Class.insertOne(cClassBody , {cols:"classId , className , createdAt , deletedAt , image , status , numberOfProducts" , where:`createdAt="${cClassBody.createdAt.toISOStringV2().slice(0 , 19).replace("T" , " ")}"`});

    res.status(201).json(newClass[0]);

    req.file && next();
});

exports.editClass = catchAsync(async(req , res , next)=>{
    const editClassBody = {};
    const body = req.body;

    let classification = req.classification;

    if(classification.length == 0)
        throw new error(`لا يوجد تصنيف بهذا المُعرِف` , 1025 , 404 , true);

    body.className && (editClassBody.className = body.className);

    if(req.file){

        classification[0].image && await unlink(__dirname + `/../public${classification[0].image}`).catch(err =>{console.log(err);});

        req.file.fileName = `classifications/${randomString(10)}_${new Date().toISOStringV2().replace(/:/g , "-")}.${req.file.type}`;
        editClassBody.image = `/images/${req.file.fileName}`;
    };

    Object.keys(editClassBody).length && (classification = await Class.update(editClassBody , `classId=${classification[0].classId}`));

    delete classification[0].classNameForSearch;

    // short for discount
    
    if(body.discountPercentage || body.discountPercentage === null){
        const dper = body.discountPercentage;
        if(dper === null){
            await Promise.all([
                Product.sql(`UPDATE products SET price=oldPrice , oldPrice=NULl , discountPercentage=NULL WHERE classId=${classification[0].classId} AND oldPrice IS NOT NULL`),

                Product.sql(`DELETE FROM notifications WHERE classId=${classification[0].classId}`)
            ]);
        }else {
            if(!Number.isInteger(dper-0) || dper-0 > 100 || dper-0 < 1){
                throw new error({fieldName:"discountPercentage" , errMessage:`القيمة ${dper} غير صالحة`} , 1291 , 400 , true)
            };
            
            await Product.sql(`UPDATE products SET oldPrice=price , price=FLOOR((100-${dper})/100*price) , discountPercentage=${dper} WHERE classId=${classification[0].classId}`);

            if(body.notified === true){
                const {title , content} = notificationValidator(body , "تخفضيات!!" , `تخفضيات بنسبة ${dper} على جميع ${classification[0].className}`);

                const createdAt = new Date().toISOStringV2().slice(0 , 19).replace("T" , " ");
                console.log("here");
                await Product.sql(`INSERT INTO notifications (userId , type , title , content , classId , createdAt , status , kind) (SELECT userId , "للمستخدم" , "${title}" , "${content}" , ${classification[0].classId} , "${createdAt}" , "جديد" , "تخفيض صنف" FROM users WHERE status="مفعل" AND type="مستخدم" UNION SELECT visitorId as userId , "للزائر" , "${title}" , "${content}" , ${classification[0].classId} , "${createdAt}" , "جديد" , "تخفيض صنف" FROM visitors)`);
            };
        };
    }else if(body.discountPrice || body.discountPrice === null){
        const dpr = body.discountPrice;
        if(dpr === null){
            await Promise.all([
                Product.sql(`UPDATE products SET price=oldPrice , oldPrice=NULl , discountPercentage=NULL WHERE classId=${classification[0].classId} AND oldPrice IS NOT NULL`),
                
                Product.sql(`DELETE FROM notifications WHERE classId=${classification[0].classId}`)
            ]);
        }else{
            if(isNaN(dpr-0)){
                throw new error({fieldName:"discountPrice" , errMessage:`القيمة ${dpr} غير صالحة`} , 1292 , 400 , true)
            };
            let dNum = String(dpr).split('.')[1];
            if(dNum){  
                if(dNum.length > 2 && !rigthZeros(dNum))
                    throw new error({fieldName:"discountPrice" , errMessage:"'صيغة العدد العشري غير صحيحة. يجب أن يكون العدد العشري: .25 أو .50 أو .75 أو .00'"} , 1201 , 400 , true);
    
                dNum.length === 1 && (dNum = dNum + "0");
    
                if(!/([05][0]|[27][5])/.test(dNum) || dNum === '05') 
                    throw new error({fieldName:"discountPrice" , errMessage:"'صيغة العدد العشري غير صحيحة. يجب أن يكون العدد العشري: .25 أو .50 أو .75 أو .00'"} , 1201 , 400 , true);
            };

            await Product.sql(`UPDATE products SET oldPrice=price , discountPercentage=FLOOR(100-(100*${dpr}/price)) , price=${dpr} WHERE classId=${classification[0].classId} AND price>${dpr}`);

            if(body.notified){
                const {title , content} = notificationValidator(body , "تخفضيات!!" , `عرض خاص جميع المنتجات في تصنيف ${classification[0].className} بسعر ${dpr} ديناراً أو أقل`);

                const createdAt = new Date().toISOStringV2().slice(0 , 19).replace("T" , " ");

                await Product.sql(`INSERT INTO notifications (userId , classId , content , title , createdAt , type , kind , status) (SELECT userId , ${classification[0].classId} , "${content}" , "${title}" , "${createdAt}" , "للمستخدم" , "تخفيض صنف" , "جديد" FROM users WHERE status="مفعل" AND type="مستخدم" UNION SELECT visitorId as userId , ${classification[0].classId} , "${content}" , "${title}" , "${createdAt}" , "للزائر" , "تخفيض صنف" , "جديد" FROM visitors)`);
            };

        };
    };
    
    res.status(200).json(classification[0]);

    req.file && next();
});

exports.deleteClass = catchAsync(async(req , res , next)=>{

    const classification = req.classification;
    // ==============================================================

    /* الإجراء الخاص بحذف تصنيف لديه منتجات */
    // 1- حذف المنتجات
    // 2- نقل المنتجات

    const newClassId = req.query.classId;
    if(newClassId){
        if(!Number.isInteger(newClassId - 0))
            throw new error({queryProperty:"classId" , errMessage:`classId: ${newClassId} غير صالح.`} , 1045 , 400 , true);

        if(newClassId == classification[0].classId)
            throw new error({queryProperty:"classId" , errMessage:"لا يمكن نقل المنتجات إلى التصنيف المراد حذفه"} , 1041 , 400 , true);
        const newClass = await Class.selectOne({} , {where:`classId=${newClassId}`});

        if(newClass.length == 0)
            throw new error({queryProperty:"classId" , errMessage:"لا يوجد تصنيف بهذا المُعرِف " + newClassId} , 1047 , 400 , true);
        
        await Product.update({
            classId: newClassId
        } , `classId=${classification[0].classId}`);


        await Class.sql(`UPDATE classifications SET numberOfProducts=numberOfProducts+${classification[0].numberOfProducts} WHERE classId=${newClassId}`);
        /* await Class.update({
            numberOfProducts: (newClass[0].numberOfProducts-0) - (-classification[0].numberOfProducts)
        } , `classId=${newClassId}`); */
    }else{

        await Product.update({status:"محذوف"} , `classId=${classification[0].classId}` , false);
    
    };

    // ===============================================================

    await Class.update({status:"محذوف" , numberOfProducts:0  , deletedAt:new Date()} , `classId=${classification[0].classId}` , false);
    
    res.status(204).json();
    
});

exports.getClass = catchAsync(async(req , res , next)=>{

    res.status(200).json(req.classification[0]);
});

exports.getClasses = catchAsync(async(req , res , next)=>{
    const options = {};

    if(req.query.page || req.query.limit){
        options.limit = req.limit;
        options.offset =  req.offset;
    };

    options.where = `status="موجود"`

    const classes = await Class.select({classNameForSearch:false} , options);

    res.status(200).json(classes);
});

exports.isClassExist = catchAsync(async(req , res , next)=>{
    const classification = await Class.selectOne({classNameForSearch:false} , {where:`classId=${req.params.classId} AND status="موجود"`});

    if(classification.length == 0)
        throw new error("لا يوجد تصنيف بهذا المُعرِف" , 1025 , 404 , true);

    req.classification = classification;

    next();
});