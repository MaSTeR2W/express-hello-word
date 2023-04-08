Date.prototype.getCurrentTime = function(){
    const now = new Date(this.setMinutes(this.getMinutes() - this.getTimezoneOffset()));
    return now;
};

Date.prototype.getAntiISODate = function(){
    return this.getFullYear() + "-" + (this.getMonth()-0+1) + "-" + this.getDate();
};