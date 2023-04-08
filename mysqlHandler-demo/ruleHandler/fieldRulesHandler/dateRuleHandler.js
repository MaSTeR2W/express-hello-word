const {fieldError} = require("./../../errorHandler/errorHandler");

exports.dateHandler = async(row , rule , colName , fieldValue)=>{
    
    if(isNaN(new Date(fieldValue).getDay())) {
        return new fieldError(1007 , colName ,`The date value is not valid ${fieldValue}`);
    };

    row[colName] = fieldValue.toISOStringV2().slice(0 , 19).replace('T' , ' ');

};