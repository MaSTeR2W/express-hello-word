const {unlink} = require("fs/promises");

const User = require("./../models/userModel");

const {catchAsync} = require("./../utilities/catchFun");
const error = require("./../utilities/error");
const {validateStringWithErrors} = require("./../utilities/validateUserProfile");
const {randomString} = require("./../utilities/myCrypto");

exports.isUserExist = catchAsync(async(req , res , next)=>{

    if(req.user[0].userId = req.params.userId)
        return next();

    if(req.user[0].type == "مستخدم")
        throw new error("ليس لديك صلاحية للولوج" , 1217 , 403 , true);
    
    const user = await User.selectOne({
        password:false,
        salt:false,
        passwordChanagedAt:false,
        vCode:false,
        vCodeExp:false,
        vCodeTimes:false,
        lastVCode:false,
        userNameForSearch:false
    } , {where:`userId=${req.params.userId}`});


    if(user.length == 0)
        throw new error("لا يوجد مستخدم بهذا المُعرِف" , 1219 , 404 , true);
    
    if(req.user[0].type == "مشرف" && user[0].type != "مستخدم")
        throw  new error("ليس لديك صلاحية للولوج" , 1220 , 403 , true);

    req.user = user;
    next();
});

exports.editProfile = catchAsync(async(req , res , next)=>{
    // userName , image , city , position , nearestPosition , gps
    const body = req.body;
    const ePBody = {};
    const errors = [];

    if(body.userName){
        validateStringWithErrors("userName" , body.userName , 40 , 3 , errors);
        ePBody.userName = body.userName;
    }else if(body.userName === null){
        ePBody.userName = null;
    };

    if(body.city){
        validateStringWithErrors("city" , body.city , 40 , 2 , errors);
        ePBody.city = body.city;
    }else if(body.city === null){
        ePBody.city = null;
    };

    if(body.position){
        validateStringWithErrors("position", body.position , 40 , 3 , errors);
        ePBody.position = body.position;
    }else if(body.position === null){
        ePBody.position = null;
    };

    if(body.nearestPosition){
        validateStringWithErrors("nearestPosition" , body.nearestPosition , 100 , 3 , errors);
        ePBody.nearestPosition = body.nearestPosition;
    }else if(body.nearestPosition === null){
        ePBody.nearestPosition = null;
    };

    if(body.gps){
        validateStringWithErrors("gps" , body.gps , 300 , 1 , errors);
        body.gps = body.gps;
    }else if(body.gps === null){
        body.gps = null;
    };

    if(errors.length > 0)
        throw new error(errors , 1221 , 400 , true);

    if(req.file){
        req.file.fileName = `users/${req.user[0].userId}_${randomString(10)}_${new Date().toISOStringV2().replace(/:/g , "-")}.${req.file.type}`;

        if(req.user[0].image != "/images/users/noImage.png")
            await unlink(`public${req.user[0].image}`);
        
        ePBody.image = `/images/${req.file.fileName}`;
    };

    if(Object.keys(ePBody).length == 0)
        return res.status(200).json();
    console.log("here");
    await User.update(ePBody , `userId=${req.params.userId}` , false);

    res.status(200).json(ePBody);

    req.file && next();
});