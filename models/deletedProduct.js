/* const mysqlHandler = require("./../mysqlHandler-demo/mysqlHandler");

const deletedProductTable = {
    productId:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true
    },
    classId:{
        type:"number",
        dataType:"SMALLINT",
        unsigned:true,
    },
    productName:{
        type:"string",
        dataType:"VARCHAR(100)"
    },
    quantity:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true
    },
    price:{
        type:"number",
        dataType:"FLOAT",
        unsigned:"يجب أن يكون للسعر قيمة موجبة"
    },
    description:{
        type:"string",
        dataType:"VARCHAR(250)"
    },
    createdAt:{
        type:"date",
        dataType:"DATETIME"
    },
    deletedAt:{
        type:"date",
        dataType:"DATETIME"
    },
    atRunsOut:{
        type:"string",
        dataType:"VARCHAR(70)"
    },
    orderLimit:{
        type:"number",
        dataType:"SMALLINT",
        unsigned:"يجب أن يكون لحد الطلب قيمة صحيحة موجبة",
        default:5
    },
    image:{
        type:"string",
        dataType:"VARCHAR(78)"
    },
    purchased:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true
    },
    "PRIMARY KEY":{
        pKName:"productId"
    },
};

const DeletedProduct = new mysqlHandler.createTable(deletedProductTable , "deletedProducts");

module.exports = DeletedProduct; */