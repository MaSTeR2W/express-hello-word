const mysqlHandler = require("./../mysqlHandler-demo/mysqlHandler");

const appOptionTable = {
    optionId:{
        type:"number",
        dataType:"TINYINT",
        unsigned:true,
        default:1
    },
    maximumCartItems:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true
    },
    maximumOrdersPerUser:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true
    },
    shopStatus:{
        type:"string",
        dataType:"VARCHAR(5)"
    },
    dailyMessageLimit:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true
    },
    monthlyMessageLimit:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true
    },
    logo:{
        type:"string",
        dataType:"VARCHAR(100)"
    },
};

const AppOption = new mysqlHandler.createTable(appOptionTable , "appOption");

module.exports = AppOption;