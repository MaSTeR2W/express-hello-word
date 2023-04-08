const mysqlHandler = require("./../mysqlHandler-demo/mysqlHandler");


const notificationTable = {
    userId:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true
    },
    type:{
        type:"string",
        dataType:"VARCHAR(10)",
        default:"للمستخدم",
    },
    title:{
        type:"string",
        dataType:"VARCHAR(100)",
        maxLength:{
            length:100,
            errMessage:"العنوان طويل جدا"
        }
    },
    content:{
        type:"string",
        dataType:"VARCHAR(200)",
        maxLength:{
            length:200,
            errMessage:"محتوى الإشعار طويل جدا"
        }
    },
    productId:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true
    },
    classId:{
        type:"number",
        dataType:"SMALLINT",
        unsigned:true
    },
    kind:{
        type:"string",
        dataType:"VARCHAR(15)",
        default:"إداري"
    },
    createdAt:{
        type:"date",
        dataType:"DATETIME"
    },
    status:{
        type:"string",
        dataType:"VARCHAR(6)"
    },
    
    index:{
        indexers:[
            {iName:"userId_notification_index" , iCol:"userId"}
        ]
    }
};

const Not = new mysqlHandler.createTable(notificationTable , "notifications");

module.exports = Not;