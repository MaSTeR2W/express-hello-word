
const {fieldError , error} = require("./../../errorHandler/errorHandler");

exports.uniqueHandler = async(row , rule , colName , isDefault , getSession , tableName)=>{
    
    const type = rule.getProp("type");

    const where = type === "string"? `${colName}="${row[colName]}"` : `${colName}=${row[colName]}`; 
    const [query] = await getSession().execute(`SELECT ${colName} FROM ${tableName} WHERE ${where} LIMIT 1`);
    if(query.length !== 0){
        if(isDefault) 
        throw new error(1017 , "The defaul value can not be used twice with NOT NULL UNIQUE column");

        return new fieldError(1018 , colName ,  rule.unique);
    };
}