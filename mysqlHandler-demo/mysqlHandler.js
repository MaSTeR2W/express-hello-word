require("./prototype/objectProtoType");

const mysql = require('mysql2/promise');
const tableHandler = require('./tableHandler/tableHandler');

const {stayConnected , wait} = require("./auxiliaryFunctions");

let schemaName;
let session;
let connected = false;

const isConnected = ()=>{
  return connected;
}

const getSession = ()=>{
  return session;
};

const getSchemaName = ()=>{
  return schemaName;
}

exports.createConnection = async(options)=>{
    schemaName = options.database;
    session = await mysql.createConnection(options);
    connected = true;
    stayConnected(getSession , 40 , isConnected);
    session.on("error" , async function(err) {
        if(err.code === 'PROTOCOL_CONNECTION_LOST'){
            connected = false;
            console.log('The data base connection is losted');
            console.log(err);
            await session.end();
            await wait(2000);
            session = await mysql.createConnection(options);
            connected = true;
            // record table
        } else {
          throw err;
        }
    });
};



exports.createTable = tableHandler.createTable(getSession , getSchemaName , isConnected);
