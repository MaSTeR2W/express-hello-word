
const {fieldError} = require("./../../errorHandler/errorHandler");

exports.arrayHandler = async(row , rule , colName , fieldValue)=>{
    const maxLength = rule.getProp("maxLength");
    const stringifiedValue = JSON.stringify(fieldValue).replace(/'/g , "\\'");

    if(stringifiedValue.length > maxLength.length) return new fieldError(1006 , colName ,maxLength.errMessage);

    row[colName] = stringifiedValue;
}