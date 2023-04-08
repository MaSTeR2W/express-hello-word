Object.prototype.getProp = function(propName){
    const keys = Object.keys(this);
    const values = Object.values(this);
    for(let i = 0 ; i < keys.length ; i++) keys[i] = keys[i].toLowerCase();
    const index = keys.indexOf(propName.toLowerCase());
    if(index > -1) return values[index];
    return undefined;
};
Date.prototype.toISOStringV2 = function(){
    const date = new Date(this);
    date.setHours(date.getHours() - date.getTimezoneOffset() / 60);
    return date.toISOString();
};