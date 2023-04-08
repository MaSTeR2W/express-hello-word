const mysqlHandler = require("./../mysqlHandler-demo/mysqlHandler");

const orderTable = {
    orderId:{
        type:"number",
        dataType:"INT",
        unsigned:true,
        autoIncrement:true
    },
    userId:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true
    },
    status:{
        type:"string",
        dataType:"VARCHAR(12)",
        validate:(err , value)=>{
            if(!["معلق" , "جارٍ الإنجاز" , "ملغي" , "مُنجز"].includes(value))
                err("إما أن تكون الحالة (جارٍ الإنجاز) أو (معلق) أو (مُنجز) أو (ملغي).");
        }
    },
    orderedAt:{
        type:"date",
        dataType:"DATETIME"
    },
    archivedAt:{
        type:"date",
        dataType:"DATETIME"
    },
    "PRIMARY KEY":{
        pKName:"orderId"
    },
    index:{
        indexers:[
            {
                iName:"orders_userId" , iCol:"userId"
            }
        ]
    }
};

const Order = new mysqlHandler.createTable(orderTable , "orders");

module.exports = Order;