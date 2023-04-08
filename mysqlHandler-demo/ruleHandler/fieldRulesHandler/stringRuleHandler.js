
const {fieldError} = require("./../../errorHandler/errorHandler");

exports.stringHandler = async(row , rule , colName , fieldValue)=>{
    const maxLength = rule.getProp("maxLength");
    const minLength = rule.getProp("minLength");
    const trim = rule.getProp("trim");
    row[colName] = fieldValue.replace(/'/g, "\\'");
    if(trim) row[colName] = fieldValue = fieldValue.trim();

    if(maxLength) if(fieldValue.length > maxLength.length) return new fieldError(1013 , colName , maxLength.errMessage);

    if(minLength) if(fieldValue.length < minLength.length) return new fieldError(1014 , colName , minLength.errMessage);

}