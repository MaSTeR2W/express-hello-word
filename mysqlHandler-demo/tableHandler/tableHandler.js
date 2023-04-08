const ruleHandler = require('./../ruleHandler/ruleHandler');
const queryHandler = require("./../queryHandler/queryHandler");
const auxiliaryFunctions = require('./../auxiliaryFunctions');

const extractCreateSqlStatement = (columns , tableName , schemaName)=>{
    const cols = [];
    
    const fields = Object.keys(columns);
    for(let i = 0 ; i < fields.length ; i++){
        ["PRIMARY KEY" , "CONSTRAINT" , "REFERENCES" , "INDEX" , "FOREIGN KEY"].includes(fields[i].toUpperCase())? cols.push(`${columns[fields[i]].sql}`) :
        cols.push(`${fields[i]} ${columns[fields[i]].sql}`);
    };
    //configurations
    /* const confs = Object.keys(columns.confs);
    for(let i = 0 ; i < fields.length ; i++){
        cols.push(`${confs[i]} ${columns[confs[i]]}`);
    }
 */
    return `CREATE TABLE IF NOT EXISTS ${schemaName}.${tableName} (${cols}) CHARACTER SET utf8 COLLATE utf8_general_ci ENGINE = InnoDB;`;
}

exports.createTable = (getSession , getSchemaName , isConnected)=>{
    return (function(columns , tableName){
        // wait connection to be done
        const {insertRule , updateRule , whereRule , tableCols} = ruleHandler.extractRule(columns , tableName);
        
        (async()=>{
            if(!isConnected()) await auxiliaryFunctions.waitingConnection(getSession);
            const sql = extractCreateSqlStatement(columns , tableName , getSchemaName());
            await getSession().execute(sql);
        })();

        this.tableCols = tableCols;

        this.insertOne = async(row , getInsertedRow , acceptId)=>{
            if(!isConnected())await auxiliaryFunctions.waitingConnection(getSession);
            return await queryHandler.insertOne(row , getSession , tableName , insertRule , tableCols , getInsertedRow , acceptId);
        };
        
        this.select = async (fields , opts)=>{
            //opts{where , orderedBy , descending=true , limit , offset , counting=false}
            

            if(!isConnected())await auxiliaryFunctions.waitingConnection(getSession);
            return await queryHandler.select(fields , opts , getSession , tableName , tableCols , undefined);
        };

        this.selectOne = async (fields , opts)=>{
            if(!isConnected())await auxiliaryFunctions.waitingConnection(getSession);
            return await queryHandler.selectOne(fields , opts , getSession , tableName , tableCols , undefined);
        };

        this.update = async (row , where , returnNewRow)=>{
            if(!isConnected())await auxiliaryFunctions.waitingConnection(getSession);
            return await queryHandler.update(row , where , getSession , tableName , updateRule , whereRule , tableCols , returnNewRow);
        };

        this.remove = async(where)=>{
            if(!isConnected())await auxiliaryFunctions.waitingConnection(getSession);
            return await queryHandler.remove(where , getSession , tableName);
        };

        this.count = async(where)=>{
            if(!isConnected())await auxiliaryFunctions.waitingConnection(getSession);
            return await queryHandler.count(getSession , tableName , where);
        };

        this.sql = async(sql)=>{
            if(!isConnected())await auxiliaryFunctions.waitingConnection(getSession);
            return await queryHandler.sql(sql , getSession , tableName);
        };
    });
}




/* 
{
    userName:{
        sql: "",
        auto: true
        validate:,
        required:,
        default:,
        type:"(String , Number) / go below , (Array , JSON) dont go below"
        maxLength:,
        minLength:,
        biggestNum:[]
        lowestNum:[]
        trim: 
        unique:
    }
}
*/