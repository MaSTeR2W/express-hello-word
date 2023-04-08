const {whereRuleHandler} = require("../../ruleHandler/whereRuleHandler");

exports.equal = async(where , whereRule , colName , fieldValue , tableCols , tableName)=>{

    // check the value 
    await whereRuleHandler(where , whereRule , colName , fieldValue , tableCols , tableName);

    return ` ${colName}=${fieldValue}`;
};