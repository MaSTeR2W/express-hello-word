
exports.autoIncrementHandler = async(row , rule , colName , acceptId)=>{
    
    const autoIncrement = rule.getProp("autoIncrement");
    
    if(autoIncrement){

        Object.prototype.hasOwnProperty.bind(row)(colName) && !acceptId && delete row[colName] && 
        // should be thrown an error in the future
        console.warn(`Warning: The ${colName} column is an auto increment column, so it is not possible to enter a value for it. In the future version it will be thrown an error.`);
        return true;
    };
    return false;
}