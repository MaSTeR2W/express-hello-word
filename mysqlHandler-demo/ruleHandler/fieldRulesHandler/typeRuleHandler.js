const {getType} = require("./../../auxiliaryFunctions");
const {fieldError} = require("./../../errorHandler/errorHandler"); 

exports.typeHandler = async(row , rule , colName , fieldValue)=>{

    const type = rule.getProp("type");
    let valueType = getType(fieldValue);
    
    if(!["string" , "number" , "date" , "object" , "array"].includes(valueType)) {
        return new fieldError(1015 , colName , `The value type of the field is ${valueType} but, it should be ${type}`);
    };
    
    if(valueType == "string" && type == "number"){
        const number = fieldValue - 0;
        if(!isNaN(number)) 
            row[colName] = number;
        else
            return new fieldError(1015 , colName , `The value type of the field is ${valueType} but, it should be ${type}`);
            
        valueType = "number";
    }else if(valueType == "number" && type == "string"){
        row[colName] = fieldValue + "";
        valueType = "string"
    };

    if(valueType !== type) return new fieldError(1016 , colName ,  `The value type of the field should be ${type}. But, the recieved type is ${valueType}`);

    return type;
}