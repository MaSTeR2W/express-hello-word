const error = require("./../utilities/error");
const {catchAsync} = require("./../utilities/catchFun");

exports.validateId = (...whichIds)=>{
    return catchAsync(async(req , res , next)=>{
        for (const whichId of whichIds) {
            
            const id = req.params[whichId];
            // empty , empty string 
            if(!id || !Number.isInteger(id - 0))
                throw new error({paramName:whichId , errMessage:`${whichId}: (${id}) غير صالح.`} , 1001 , 400 , true);
        };
        next();
    });
};