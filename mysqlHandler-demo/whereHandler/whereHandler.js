const {getType} = require("./../auxiliaryFunctions");

const operators = require("./operatorsObject");

exports.whereHandler = async(where , whereRule , getSession , tableName , tableCols)=>{
    // if where is a query not an object
    if(getType(where) === "string") return where;

    for (const property in where) {
        if(!where.hasOwnProperty(property)) continue;
        const propertyValue = where[property];
        let mysqlWhereQuery = '';

        if(property.startsWith("$")){
            // operator and its value is not MySQL query

        }else if(property.startsWith("_")){
            // operator and its value is MySQL query
        }else{
            // column Name and the operation in this case will be equality
            mysqlWhereQuery += await operators[property](where , whereRule , property , propertyValue , tableCols , tableName);
        };
    };


    // return where sql
}