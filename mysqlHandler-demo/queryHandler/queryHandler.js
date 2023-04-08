const {matchingCols , whichColsToSelect} = require("./../tableHandler/colsMatchingHandler");
const {insertRuleHandler} = require("./../ruleHandler/insertRuleHandler");
const {updateRuleHandler} = require("./../ruleHandler/updateRuleHandler");
const {getType , isQuoteEscaped} = require("./../auxiliaryFunctions");
const {error} = require("./../errorHandler/errorHandler");

exports.insertOne = async(row , getSession , tableName , insertRule , tableCols , getInsertedRow , acceptId)=>{
        
    // check if the fields of the row is the as defined
    await matchingCols(Object.keys(row) , tableCols , tableName);
    
    // check rule
    await insertRuleHandler(row , insertRule , getSession , tableName ,acceptId);
    
    const cols = Object.keys(row);

    /* const values = Object.values(row).map(el=>{
        return el === "NULL"? `${el}` : typeof el == "string"? `'${el.replace(/'/g , "\\'")}'`: el;
    }); */
    const values = [];
    for (const key in row){

        if(!Object.prototype.hasOwnProperty.bind(row)(key))
            continue;

        const value = row[key];

        if(value == "NULL") 
            values.push(`${value}`);

        else if(typeof value == "string")
            if(isQuoteEscaped(value)){
                values.push(`'${value}'`);
            }
            else{
                values.push(`'${(value).replace(/'/g , "\\'")}'`);
            }   

        else 
            values.push(value);
    };

    getSession().execute(`INSERT INTO ${tableName} (${cols}) VALUES (${values})`);
    if(getInsertedRow){
        const [result] = await getSession().execute(`SELECT ${getInsertedRow.cols} FROM ${tableName} WHERE ${getInsertedRow.where}`);
        return result;
    }
    
};

exports.select = async(fields , opts, getSession , tableName ,tableCols ,selectRule)=>{

    // because there is a need to check some consideration the colsMatching function is transfered to whichColsToSelectFunction

    const selectFields = await whichColsToSelect(fields , tableCols , tableName);

    let query = `SELECT ${selectFields} FROM ${tableName}`;
    let count = "";
    if(typeof opts != "undefined"){

        if(getType(opts) != "object") throw new error(1000 , `The second argument is not an object but ${getType(opts)}`);

        opts.where && (query += ` WHERE ${opts.where}`.replace(/'/g , "\\'"));
        opts.orderedBy && (query += ` ORDER BY ${opts.orderedBy}`);
        opts.orderedBy && opts.descending && opts.descending === true &&(query += ` DESC`);

        // length -------------------------//
        opts.limit && opts.limit >= 0  && (query += ` LIMIT ${opts.limit}`) && 
        opts.offset && opts.offset >= 0 && (query += ` OFFSET ${opts.offset}`);
        opts.counting && (count += `SELECT COUNT(*) FROM ${tableName}`) && opts.where && (count += ` WHERE ${opts.where};`);
    };
    // length of the table ---------------------//
    const [result] = await getSession().execute(query);
    if(count){
        const [records] = await getSession().execute(count);
        return {result , records:records[0]['COUNT(*)']};
    }
    return result;
};

exports.selectOne = async(fields , opts , getSession , tableName , tableCols , selectRule)=>{

    const selectFields = await whichColsToSelect(fields , tableCols , tableName);
    
    let query = `SELECT ${selectFields} FROM ${tableName}`;
    
    if(typeof opts != "undefined"){
        if(getType(opts) != "object") throw new error(1001 , `The second argument is not an object but ${getType(opts)}`);

        opts.where && (query += ` WHERE ${opts.where}`.replace(/'/g , "\\'"));
    };

    // length -------------------------//
    query += ` LIMIT 1`;
    // length of the table ---------------------//
    const [result] = await getSession().execute(query);
    return result;
};

exports.update = async(row , where , getSession , tableName , updateRule , whereRule , tableCols , returnNewRow=true)=>{

    await matchingCols(Object.keys(row) , tableCols , tableName);

    // check rule
    await updateRuleHandler(row ,updateRule , getSession , tableName);

    const cols = Object.keys(row);
    const values = Object.values(row);

    
    let query = `UPDATE ${tableName} SET `;
    
    for(let i = 0 ; i < cols.length ; i++){
        if(typeof values[i] == "string"){
            if(isQuoteEscaped(values[i]))
                query += `${cols[i]}='${values[i]}'`;
            else
                query += `${cols[i]}='${values[i].replace(/'/g , "\\'")}'`
        }else{
            query += values[i]== null? `${cols[i]}=NULL`:`${cols[i]}=${values[i]}`;
        };
/*         query += typeof values[i] == "string"? `${cols[i]}='${values[i].replace(/'/g , "\\'")}'` : `${cols[i]}=${values[i]}`; */
        i + 1 < cols.length && (query += ",");
    };
    
    
    // where
    where && (query += ` WHERE ${where}`);
    const [result] = await getSession().execute(query);
    if(returnNewRow){
        const [newRow] = await getSession().execute(`SELECT * FROM ${tableName} WHERE ${where} LIMIT 1`);
        return newRow;
    };
    return result;
    
}

exports.remove = async(where , getSession , tableName)=>{
    let query = `DELETE FROM ${tableName}`;
    where && (query += ` WHERE ${where}`.replace(/'/g , "\\'"));
    await getSession().execute(query);
};

exports.count = async(getSession , tableName , where)=>{
    let countQuery = `SELECT COUNT(*) FROM ${tableName}`;
    where && (countQuery += ` WHERE ${where}`);
    const [result] = await getSession().execute(countQuery);
    return result[0]["COUNT(*)"];
};

exports.sql = async(sql , getSession , tableName)=>{
    sql = sql.replace("tableName" , tableName);
    const [result] = await getSession().execute(sql);
    return result;
};

/* 
===================================
1-تصحيح موضوع التاريخ createdAt

2023-12-01T23:15:15.413Z ---> 2023-12-01T23:15:15.413Z;

*/