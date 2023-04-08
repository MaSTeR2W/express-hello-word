module.exports = function(errMessage , errCode , statusCode , isOperational , pageResponse = false){
    const error = new Error();

    this.errMessage = errMessage;
    this.errCode = errCode;
    this.statusCode =statusCode;
    this.isOperational = isOperational;
    this.pageResponse = pageResponse;
    this.errStack = error.stack;
};