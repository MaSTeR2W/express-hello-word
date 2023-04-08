exports.error = function(errCode , errMessage){
    const err = new Error();
    this.errCode = errCode;
    this.errMessage = errMessage;
    this.stack = err.stack;
    this.originatedBy = "mysqlHandler";
};

exports.fieldError = function(errCode , fieldName , errMessage){
    this.errCode = errCode;
    this.errMessage = errMessage;
    this.fieldName = fieldName;
    // user frindly
};

exports.fieldsErrorsCollection = function(errCode , errsArray){
    const err = new Error();
    this.errCode = errCode;
    this.errMessage = errsArray;
    this.stack = err.stack;
    this.originatedBy = "mysqlHandler";
}
// هظي بتاع الvalidate

