

// =================================================================
// insert rule
const {updateNotNullHandler} = require("./fieldRulesHandler/notNullRuleHandler");
const {autoIncrementHandler} = require("./fieldRulesHandler/autoIncrementRuleHandler");
const {typeHandler} = require("./fieldRulesHandler/typeRuleHandler");
const {numberHandler} = require("./fieldRulesHandler/numberRuleHandler");
const {stringHandler} = require("./fieldRulesHandler/stringRuleHandler");
const {arrayHandler} = require("./fieldRulesHandler/arrayRuleHandler");
const {dateHandler} = require("./fieldRulesHandler/dateRuleHandler");
const {objectHandler} = require("./fieldRulesHandler/objectRuleHandler");
const {uniqueHandler} = require("./fieldRulesHandler/uniqueRuleHandler");
//###################################################################

const {error , fieldError , fieldsErrorsCollection} = require("./../errorHandler/errorHandler");
const errArray = [];

let isValidationFunctionErrorUsed = false;
const err = (colName)=>{
    return (message)=>{
        errArray.push(new fieldError(1023 , colName , message));
        isValidationFunctionErrorUsed = true;
    };
};

exports.updateRuleHandler = async(row , updateRule , getSession , tableName)=>{
    errArray.splice(0 , errArray.length);
    for (const colName in updateRule) {
        if (!updateRule.hasOwnProperty(colName)) continue;
        if(!Object.prototype.hasOwnProperty.bind(row)(colName)) continue;

        let fieldValue = row[colName];
        const rule = updateRule[colName];

        if(rule.getProp("as")) continue;

        // auto incerment
        if((await autoIncrementHandler(row , rule , colName))) continue;
        

        const notNull = await updateNotNullHandler(row , rule , colName , fieldValue);
        if(notNull instanceof fieldError){
            errArray.push(notNull);
            continue;
        };
        if(notNull?.jump === true)
            continue;

        

        let validate = rule.getProp("validate");
        let unique = rule.getProp("unique");


        const type = await typeHandler(row , rule , colName , fieldValue);

        if(type instanceof fieldError){
            errArray.push(type);
            continue;
        };

    
        if(type === "string" || type === "number"){
                
            if(type === "number"){
                
                const isNumberValid = await numberHandler(row , rule , colName , fieldValue);
                if(isNumberValid){
                    errArray.push(isNumberValid);
                    continue;
                };
               
            }else if(type === "string"){
                
                const isStringValid = await stringHandler(row , rule , colName , fieldValue);

                if(isStringValid){
                    errArray.push(isStringValid);
                    continue;
                };
                
            };

            if(validate){
                rule.validate(err(colName) , fieldValue);
                if(isValidationFunctionErrorUsed) continue;
            };

            if(unique){

                const unique = await uniqueHandler(row , rule , colName , undefined , getSession , tableName);
                if(unique){
                    errArray.push(unique);
                    continue;
                };
                
            };
        }else{

            if(type === "array"){

                const array = await arrayHandler(row , rule , colName , fieldValue);
                if(array){
                    errArray.push(array);
                    continue;
                };
                
            }else if(type === "date"){

                const date = await dateHandler(row , rule , colName , fieldValue);
                if(date){
                    errArray.push(date);
                    continue;
                };

            }else if(type === "object"){

                const object = await objectHandler(row , rule , colName , fieldValue);
                if(object){
                    errArray.push(object);
                    continue;
                };

            }else{
                throw new error(2000 , `unhandled type: ${type}`);
            };

            if(validate){
                rule.validate(err(colName) , fieldValue);
                if(isValidationFunctionErrorUsed) continue;
            };
        };

    };
    if(errArray.length > 0) throw new fieldsErrorsCollection(2051 , errArray);
};