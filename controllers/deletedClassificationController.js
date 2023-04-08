const {unlink} = require("fs/promises");

const Class = require("./../models/classificationModel");

const {catchAsync} = require("./../utilities/catchFun");
const error = require("./../utilities/error");


exports.getDeletedClasses = catchAsync(async(req , res , next)=>{
    const options = {};

    if(req.query.page || req.query.limit){
        options.limit = req.limit;
        options.offset =  req.offset;
    };
    
    options.where = `status="محذوف"`;

    const classes = await Class.select({classNameForSearch:false} , options);

    res.status(200).json(classes);
});

exports.isDeletedClassExist = catchAsync(async(req , res , next)=>{
    const _class = await Class.selectOne({classNameForSearch:false} , {where:`classId=${req.params.classId} AND status="محذوف"`});

    if(_class.length == 0)
        throw new error("لا يوجد تصنيف محذوف بهذا المُعرِف" , 1105 , 404 , true);

    req.class = _class;
    next();
});

exports.getDeletedClass = catchAsync(async(req , res , next)=>{
    res.status(200).json(req.class[0]);
});

exports.retrievingClass = catchAsync(async(req , res , next)=>{
    await Class.update({status:"موجود" , deletedAt:null} , `classId=${req.class[0].classId}`);

    res.status(200).json();
});

exports.permanetlyDelete = catchAsync(async(req , res , next)=>{
    await Class.remove(`classId=${req.class[0].classId}`);
    
    res.status(204).json();

    if(req.class[0].image != "/images/classifications/noImage.png")
        unlink(`public${req.class[0].image}`);
});