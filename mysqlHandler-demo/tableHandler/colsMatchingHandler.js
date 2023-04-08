const {getType} = require("./../auxiliaryFunctions");
const {error} = require("./../errorHandler/errorHandler");

const matchingCols = async(queryCols , tableCols , tableName)=>{
    if(queryCols instanceof Array){
        for (const col of queryCols) {
            if(!tableCols.includes(col)) throw new error(1019 , `العمود ${col} غير موجود في الجدول ${tableName}`);
        }
        return queryCols;
    };
};

exports.matchingCols = matchingCols;

const isColExist = async(colName , tableCols , tableName)=>{

    if(!tableCols.includes(colName)) throw new error(1020 , `العمود ${col} غير موجود في الجدول ${tableName}`);

    return true;
};

exports.isColExist = isColExist;

const whichColsToSelect = async(fields , tableCols , tableName)=>{
    if(!fields) return " * ";
    const type = getType(fields);
    if(type != "object") throw new error(1021 , `The first argument should be an object not ${type}`);

    const colsName = Object.keys(fields);

    if(colsName.length == 0) return " * ";

    await matchingCols(colsName , tableCols , tableName);

    const colsOpts = Object.values(fields);

    let selectQuery = [];

    let falsySelect = false;
    let truelySelect = false;
    for(let i = 0 ; i < colsName.length ; i++){
        if(colsOpts[i] == true){
            truelySelect = true;
            selectQuery.push(colsName[i]);
        }else{
            falsySelect = true;
        };
    };
    if(falsySelect && !truelySelect){
        for(let i = 0 ; i < tableCols.length ; i++){
            colsName.includes(tableCols[i]) || selectQuery.push(tableCols[i]);
        };
    };
    return selectQuery.join(",");
};

exports.whichColsToSelect = whichColsToSelect;