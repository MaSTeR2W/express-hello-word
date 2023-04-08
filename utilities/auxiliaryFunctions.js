const getType = (variable)=>{
    const type = Object.prototype.toString.call(variable);
    return type.slice(8 , type.length - 1).toLowerCase();
};

exports.getType = getType;


const resetTime = (date)=>{
    date.setMinutes(date.getMinutes() - -date.getTimezoneOffset());
};

exports.resetTime = resetTime;

exports.escapeRegex = function(string){
    return string.replace(/[/\-\\^$*"+?.()|[\]{}]/g, '\\$&');
};

exports.removeFullTextOperators = function(string){
    return string.replace(/["+-*@><)(~)]/g , "");
};