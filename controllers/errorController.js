const ErrLog = require("./../models/errLogModel");

const {catchAsync} = require("./../utilities/catchFun");
const  error = require("./../utilities/error");

module.exports = async (err , req , res , next)=>{
    console.log(err);
   /*  res.status(err.statusCode||400).json(err); */
    const statusCode = err.statusCode || 500;
    const errMessage = err.message || err.errMessage || "no error message";
    const errStack = err.stack || err.errStack || "no error stack";
    const errCode = String(err.code || err.errCode) || null;
    const originatedBy = err.originatedBy || null;

    ![400 , 401 , 403 , 404 , 405].includes(statusCode) && await ErrLog.insertOne({
        statusCode,
        errMessage,
        errStack,
        errCode,
        originatedBy,
        createdAt:new Date()
    });

    if(!res.headersSent)
        res.status(statusCode).json({errMessage});
};

module.exports.getErrors = catchAsync(async(req , res , next)=>{

    // password to enter this section

    const statusCode = req.query.statusCode-0;
    const options = {
        offset:req.offset,
        limit:req.limit,
    };
    if(statusCode){
        if(!Number.isInteger(statusCode))
            throw new error({queryProperty:"statusCode" , errMessage:`القيمة ${statusCode} غير صالحة`});

        options.where = String(statusCode).startsWith("-")? `statusCode<>"${statusCode}"`:`statusCode="${statusCode}"`;

    };

    const errLogs = await ErrLog.select({} , options);

    res.status(200).json(errLogs);
});