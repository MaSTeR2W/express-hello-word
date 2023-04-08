const mysqlHandler = require("./../mysqlHandler-demo/mysqlHandler");

const visitorTable = {
    visitorId:{
        type:"number",
        dataType:"INT",
        unsigned:true,
        autoIncrement:true
    },
    createdAt:{
        type:"string",
        dataType:"VARCHAR(23)"
    },
    lastVisit:{
        type:"date",
        dataType:"DATETIME"
    },
    "PRIMARY KEY":{
        pKName:"visitorId"
    }
};

const Visitor = new mysqlHandler.createTable(visitorTable , "visitors");

module.exports = Visitor;