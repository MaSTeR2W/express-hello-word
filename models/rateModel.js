const mysqlHandler = require("./../mysqlHandler-demo/mysqlHandler");

const rateTable = {
    rateId:{
        type:"number",
        dataType:"INT",
        usigned:true,
        autoIncrement:true
    },
    userId:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true
    },
    productId:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true
    },
    rate:{
        type:"number",
        dataType:"SMALLINT",
        notNull:"حقل مطلوب",
        biggestNum:{
            number:5,
            errMessage:"5 هو أعلى تقييم ممكن"
        },
        lowestNum:{
            number:1,
            errMessage:"1 هو أدنى تقييم ممكن"
        }
    },
    ratedAt:{
        type:"date",
        dataType:"DATETIME"
    },
    "PRIMARY KEY":{
        pKName:"rateId"
    },
    index:{
        indexers:[
            {
                iName:"userRatesIndex" , iCol:"userId"
            }
        ]
    }
};

const Rate = new mysqlHandler.createTable(rateTable , "rates");

module.exports = Rate;