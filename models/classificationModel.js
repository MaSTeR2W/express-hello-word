const mysqlHandler = require("./../mysqlHandler-demo/mysqlHandler");


const classificationTable = {
    classId:{
        type:"number",
        dataType:"SMALLINT",
        unsigned:true,
        autoIncrement:true
    },
    className:{
        type:"string",
        dataType:"VARCHAR(120)",
        maxLength:{
            length:120,
            errMessage:"120 حرفا هو الحد الاقصى لطول اسم التصنيف"
        },
        notNull:"حقل مطلوب",
        trim:true
    },
    classNameForSearch:{
        type:"string",
        dataType:"VARCHAR(120)",
        as:`(REPLACE(REPLACE(REPLACE(REPLACE(className , "أ" , "ا") , "ي" , "ى") , "إ" , "ا") , "ة" , "ه"))`
    },
    createdAt:{
        type:"date",
        dataType:"DATETIME",
        notNull:"حقل مطلوب"
    },
    deletedAt:{
        type:"date",
        dataType:"DATETIME"
    },
    numberOfProducts:{
        type:"number",
        dataType:"SMALLINT",
        unsinged:true,
        default:0
    },
    image:{
        type:"string",
        dataType:"VARCHAR(65)",
        default:"/images/classifications/noImage.png"
    },
    status:{
        type:"string",
        dataType:"VARCHAR(5)",
        default:"موجود"
    },
    "PRIMARY KEY":{
        pKName:"classId"
    },
    index:{
        indexers:[
            {
            iName:"classificationNameForSearch_index" , iCol:"classNameForSearch" , iType:"FULLTEXT"
           }
        ]
    }
};

const Class = new mysqlHandler.createTable(classificationTable , "classifications");

module.exports = Class;