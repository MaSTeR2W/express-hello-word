const mysqlHandler = require("./../mysqlHandler-demo/mysqlHandler");

const userTable = {
    userId:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true,
        autoIncrement:true
    },
    userName:{
        type:"string",
        dataType:"VARCHAR(40)",
        trim:true,
        maxLength:{
            length:40,
            errMessage:"يجب أن لا يتجاوز طول الاسم 40 حرفا"
        },
        minLength:{
            length:3,
            errMessage:"يجب أن لا يقل طول الاسم عن 3 أحرف"
        }
    },
    userNameForSearch:{
        type:"string",
        dataType:"VARCHAR(80)",
        as:`(REPLACE(REPLACE(REPLACE(REPLACE(userName , "أ" , "ا") , "ي" , "ى") , "إ" , "ا") , "ة" , "ه"))`
    },
    password:{
        type:"string",
        dataType:"VARCHAR(256)",
        notNull:"حقل مطلوب"
    },
    salt:{
        type:"string",
        dataType:"VARCHAR(128)",
        notNull:"حقل مطلوب"
    },
    passwordChanagedAt:{
        type:"date",
        dataType:"DATETIME"
    },
    vCode:{
        type:"string",
        dataType:"VARCHAR(12)"
    },
    vCodeExp:{
        type:"date",
        dataType:"DATETIME"
    },
    vCodeTimes:{
        type:"number",
        dataType:"SMALLINT",
        default:1
    },
    lastVCode:{
        type:"date",
        dataType:"DATETIME"
    },
    createdAt:{
        type:"date",
        dataType:"DATETIME",
        notNull: "تاريخ إنشاء الحساب مطلوب"
    },
    deletedAt:{
        type:"date",
        dataType:"DATETIME"
    },
    phoneNumber:{
        type:"string",
        dataType:"VARCHAR(10)",
        notNull:"رقم الهاتف مطلوب"
    },
    image:{
        type:"string",
        dataType:"VARCHAR(70)",
        maxLength:{
            length:70,
            errMessage:"70 حرف هو أقصى طول لمسار الصورة"
        },
        default:"/images/users/noImage.png"
    },
    city:{
        type:"string",
        dataType:"VARCHAR(40)",
        default:"مجهول"
    },
    position:{
        type:"string",
        dataType:"VARCHAR(40)",
        default:"مجهول"
    },
    nearestPosition:{
        type:"string",
        dataType:"VARCHAR(100)",
        default:"مجهول"
    },
    gps:{
        type:"string",
        dataType:"VARCHAR(300)"
    },
    status:{
        type:"string",
        dataType:"VARCHAR(8)",
        trim:true,
        default:"غير مفعل"
    },
    currentOrders:{
        type:"number",
        dataType:"SMALLINT",
        default:0,
        unsigned:true
    },
    type:{
        type:"string",
        dataType:"VARCHAR(6)",
        default:"مستخدم"
    },
    "PRIMARY KEY":{
        pKName:"userId"
    },
    index:{
        indexers:[
            {
                iName:"statusIndexer" , iCol:"status"
            },
            {
                iName:"userNameForSearchIndexer" , iCol:"userNameForSearch"
            },
            {
                iName:"phoneNumberForSearch" , iCol:"phoneNumber"
            },
            {
                iName:"typeIndex" , iCol:"type"
            }
            
        ]
    }
};

const User = new mysqlHandler.createTable(userTable , "users");


module.exports = User;