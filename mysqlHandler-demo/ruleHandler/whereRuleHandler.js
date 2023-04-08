/* const {isColExist} = require("./../tableHandler/colsMatchingHandler");
const {typeHandler} = require("./fieldRulesHandler/typeRuleHandler");

exports.whereRuleHandler = async(where , whereRule , colName , fieldValue , tableCols , tableName)=>{

    await isColExist(colName , tableCols , tableName);

    const rule = whereRule[colName];

    // no need to check if the property type is exist because it is always exist
    await typeHandler(where , rule , colName , fieldValue);
}; */

//=========================================
//benfing
//=========================================

/* where will be either object or string: Query */
/* whereStructure:{
    by default when does not specify operator it will be equal 
    $operator: (OR , AND , Between , In , notIn) / colName: (in default case: string || number) || ($operator: ) 
    $operator : value , _operator : SQL :validatetion;
} */

// userId:{equal , null safe equal, notEqual , gt , gte , lt , lte , AND , OR , BETWEEN , NotBetween , In , not In , IS_Null , is_Nnull REGEXP , NOTREGEXP like , not like};

/*null safe equal , equal:"number ,string" , date  */
/* notEqual: "number , string" , date */
/* gt-lt-gte-lte:"number"-"string" , date */
/* like , not Like: number , string , date */

/* regexp , notreqexp : / reguler expression / */


/* Is: string: "TRUE" , "FALSE" , "UNKNOWN" , "NULL" , boolean */

/*AND , OR: []  */
/* Between : [] */
/* notBetween: [] */
/* In: [array] */
/*  not In: [array] */