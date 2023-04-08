const mysqlHandler = require("./../mysqlHandler-demo/mysqlHandler");

const vCodeIPLimitTable = {
    ip:{
        type:"string",
        dataType:"VARCHAR(128)",
        notNull:"خاصية مطلوبة"
    },
    monthlyVCodeTimes:{
        type:"number",
        dataType:"SMALLINT",
        default:1
    },
    dailyVCodeTimes:{
        type:"number",
        dataType:"SMALLINT",
        default:1
    },
    lastVCode:{
        type:"date",
        dataType:"DATETIME",
        notNull:"خاصية مطلوبة"
    },
    status:{
        type:"string",
        dataType:"VARCHAR(5)"
    },
    "PRIMARY KEY":{
        pKName:"ip"
    }
};

const VCodeIPLimit  = new mysqlHandler.createTable(vCodeIPLimitTable , "vCodeIPLimits");

module.exports = VCodeIPLimit;