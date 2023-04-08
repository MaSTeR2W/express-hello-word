
const {fieldError} = require("./../../errorHandler/errorHandler");

exports.notNullHandler = async(row , rule , colName , fieldValue)=>{
    
    const notNull = rule.getProp("notNull");
    const _default = rule.getProp("default");

    let jump = false;
    let isDefault = false;
    if(typeof fieldValue === "undefined" || fieldValue === null){
        // if _default = null then this will make a problem
        if(typeof fieldValue === "undefined" && typeof _default != "undefined"){
            row[colName] = _default;
            isDefault = true;
        }else if(notNull){
                return new fieldError(1008 , colName ,notNull);
        }else{
            row[colName] = "NULL";
            jump = true;
        };
    };

    return {jump , isDefault};
};

exports.updateNotNullHandler = async(row , rule , colName , fieldValue)=>{

    const notNull = rule.getProp("notNull");

    if(notNull && Object.prototype.hasOwnProperty.bind(row)(colName)){
        if(typeof fieldValue === "undefined" || fieldValue === null)
            return new fieldError(1009 , colName , notNull)
    }else if(fieldValue == null){
        return {jump:true};

    };
};