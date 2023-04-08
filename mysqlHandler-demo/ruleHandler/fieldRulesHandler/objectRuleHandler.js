
const {fieldError} = require("./../../errorHandler/errorHandler");

exports.objectHandler = async(row , rule , colName , fieldValue)=>{
    const maxLength = rule.getProp("maxLength");
    const stringifiedValue = JSON.stringify(fieldValue);
    
    if(stringifiedValue.length > maxLength.length) return new fieldError(1012 , colName , maxLength.errMessage);

    row[colName] = stringifiedValue.replace(/'/g , "\\'");
}