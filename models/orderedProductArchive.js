const mysqlHandler = require("./../mysqlHandler-demo/mysqlHandler");

const orderedProductArchiveTable = {
    orderId:{
        type:"number",
        dataType:"INT",
        unsigned:true
    },
    productId:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true
    },
    price:{
        type:"number",
        dataType:"FLOAT",
        unsigned:"يجب أن يكون للسعر قيمة موجبة"
    },
    quantity:{
        type:"number",
        dataType:"SMALLINT",
        unsigned:true
    },
    totalPrice:{
        type:"number",
        dataType:"FLOAT",
        unsigned:true
    },
    index:{
        indexers:[
            {
                iName:"orderId_products" , iCol:"orderId"
            }
        ]
    }
};

const OrderedProductArchive = new mysqlHandler.createTable(orderedProductArchiveTable , "orderedProductArchives");

module.exports = OrderedProductArchive;