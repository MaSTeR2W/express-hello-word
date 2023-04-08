
const {fieldError} = require("./../../errorHandler/errorHandler");

exports.numberHandler = async(row , rule , colName , fieldValue)=>{
    
    const biggest = rule.getProp("biggestNum");
    const lowest = rule.getProp("lowestNum");
    const unsigned = rule.getProp("unsigned");

    if(unsigned) if(fieldValue < 0) return new fieldError(1010 , colName ,unsigned);

    if(biggest)if(fieldValue > biggest.number) return new fieldError(1011 , colName , biggest.errMessage);

    if(lowest) if(fieldValue < lowest.number) return new fieldError(1012 , colName , lowest.errMessage);

};