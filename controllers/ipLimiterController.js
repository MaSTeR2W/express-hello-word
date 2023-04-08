const Ip = require("./../models/vCodeIPLimit");

const {catchAsync} = require("./../utilities/catchFun");
const error = require("./../utilities/error");


exports.getIps = catchAsync(async(req , res , next)=>{
    const options = {
        offset:req.offset,
        limit: req.limit
    };

    const ips = await Ip.select({} , options);

    res.status(200).json(ips);
});

exports.isIpExist = catchAsync(async(req , res , next)=>{
    const ipAddress = String.prototype.trim.call(req.params.ipAddress);
    if(typeof ipAddress != "string" || ipAddress.length > 45 || !/^[0123456789:abcdef.]+$/.test(ipAddress))
        throw new error({fieldName:"ipAddress" , errMessage:`القيمة ${ipAddress} غير صالحة`});
    
    req.ipAddress = await Ip.selectOne({} , {where:`ip="${ipAddress}"`});


    if(req.ipAddress.length == 0)
        throw new error("عنوان ال IP غير موجود" , 1262 , 404 , true);

    next();
});

exports.editIp = catchAsync(async(req , res , next)=>{
    const status = req.body.status;
    const ip = req.ipAddress;
    if(typeof status != "string" && status != null)
        throw new error({fieldName:"status" , errMessage:`نوع البيانات ${typeof status} غير صالح`});
    console.log(status);
    console.log("=================");
    if(!["محظور" , null].includes(status))
        throw new error({fieldName:"status" , errMessage:`القيمة ${status} غير صالحة`});

    await Ip.update({status} , `ip="${ip[0].ip}"`);
    ip[0].status = status;
    res.status(200).json(ip[0]);

});

exports.deleteIp = catchAsync(async(req , res , next)=>{
    await Ip.remove(`ip="${req.ipAddress[0].ip}"`);
    res.status(204).json();
});

exports.getIp = catchAsync(async(req , res , next)=>{
    console.log(req.ipAddress);
    res.status(200).json(req.ipAddress[0]);
});
