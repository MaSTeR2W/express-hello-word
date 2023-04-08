const Product = require("./../models/productModel");
const Class = require("./../models/classificationModel");
const User = require("./../models/userModel");

const {catchAsync} = require("./../utilities/catchFun");
const error = require("./../utilities/error");
const {escapeRegex , removeFullTextOperators , getType} = require("./../utilities/auxiliaryFunctions");

const {isNumberValid} = require("./../handlers/queryHandler");

const insensitiveReplace = (key , type)=>{
    if(typeof key != "string" || (key.length > 60 && ["زائر" , "مستخدم"].includes(type)) || key.length > 120)
        throw new error({queryProperty:"key" , errMessage:`المفتاح غير صالح`});
    key = key.replace(/[إأ]/g , "ا");
    key = key.replace(/ي/g , "ى");
    key = key.replace(/ة/g , "ه");
    return key;
};

const searchForProducts = async(req , res , next)=>{
    const query = req.query;
    const key = query.key;
    const where = [];
    const errors = [];

    where.push(`(MATCH(A.productNameForSearch) AGAINST ("${key}*" IN BOOLEAN MODE) ${/^\d+$/.test(key)? `OR productId=${key}` :""})`);

    ["مشرف" , "مسؤول"].includes(req.user[0].type) || where.push('A.status="موجود"');
    

    if(query.classId){
        const classId = query.classId;
        if(!Number.isInteger(classId-0))
            errors.push({queryProperty:"classId" , errMessage:`القيمة ${classId} غير صالحة`});
        else
            where.push(`A.classId=${classId}`);
    };

    if(query.price){
        const price = query.price;
        
        if(typeof price == "string"){
            const validatePrice = isNumberValid(price , "price");
            
            if(validatePrice)
                errors.push(validatePrice);

            else
                where.push(`price=${price}`);
        }else if(getType(price) == "object"){
            //gt or gte
            //lt or lte
            if(price.gt){
                const validateGT = isNumberValid(price.gt , "price");
                if(validateGT)
                    errors.push(validateGT);
                
                else
                    where.push(`price>${price.gt}`);

            }else if(price.gte){
                const validateGTE = isNumberValid(price.gte , "price");
                if(validateGTE)
                    errors.push(validateGTE);
                
                else
                    where.push(`price>=${price.gte}`);
            };

            if(price.lt){
                const validateLT = isNumberValid(price.lt , "price");
                console.log(price.gt > price.lt);
                console.log(price.gte > price.lt);
                if(validateLT)
                    errors.push(validateLT);

                else if(price.gt && price.gt-0 > price.lt-0)
                    errors.push({queryProperty:"price.lt" , errMessage:"يجب أن تكون قيمة الخاصية lt: أكبر من قيمة الخاصية gt"});

                else if(price.gte && price.gte-0 > price.lt-0)
                    errors.push({queryProperty:"price.lt" , errMessage:"يجب أن تكون قيمة الخاصية lt: أكبر من قيمة الخاصية gte"});
                
                else
                    where.push(`price<${price.lt}`);

            }else if(price.lte){
                const validateLTE = isNumberValid(price.lte , "price");
                if(validateLTE)
                    errors.push(validateLTE);

                else if(price.gt && price.gt-0 > price.lte-0)
                    errors.push({queryProperty:"price.lte" , errMessage:"يجب أن تكون قيمة الخاصية lte: أكبر من قيمة الخاصية gt"});

                else if(price.gte && price.gte-0 > price.lte-0)
                    errors.push({queryProperty:"price.lte" , errMessage:"يجب أن تكون قيمة الخاصية lte: أكبر من قيمة الخاصية gte"});
                
                else
                    where.push(`price<=${price.lte}`);
            };
        };
    };


    const products = await Product.sql(`SELECT productId , productName , A.classId , B.className , A.image as image , quantity , price , oldPrice , discountPercentage , description , A.createdAt , A.deletedAt , atRunsOut , purchased , addedToCart FROM products as A LEFT JOIN classifications as B ON A.classId=B.classId ${req.user[0].type != "مستخدم"? "": `AND B.status="موجود"`} WHERE ${where.join(" AND ")} LIMIT ${req.limit} OFFSET ${req.offset}`);

    res.status(200).json(products);

};

const searchForClassifications = async(req , res , next)=>{
    const key = req.query.key;
    const where = `(MATCH(classNameForSearch) AGAINST ("${key}*" IN BOOLEAN MODE) ${/^\d+$/.test(key)? `OR classId=${key}`:""}) ${ ["مشرف" , "مسؤول"].includes(req.user[0].type)? "":` AND status="موجود"`}`;

    const options = {
        where,
        offset:req.offset,
        limit:req.limit
    };
    const classes = await Class.select({classNameForSearch:false} , options);
    res.status(200).json(classes);
};

const searchForUsers = async(req , res , next)=>{
    if(!["مشرف" , "مسؤول"].includes(req.user[0].type))
        throw new error("ليس لديك صلاحية للولوج" , 1207 , 403 , true);

    const key = req.query.key;
    let where = `userNameForSearch REGEXP "${escapeRegex(key)}"`;
    
    key.length < 11 && /^\d+$/g.test(key) && (where += ` OR phoneNumber REGEXP "${key}" OR userId=${key}`);

    const users = await User.select({
        password:false,
        salt:false,
        passwordChanagedAt:false,
        vCode:false,
        vCodeExp:false,
        vCodeTimes:false,
        lastVCode:false,
        userNameForSearch:false
    } , {
        offset:req.offset,
        limit:req.limit,
        where:`(${where}) ${req.user[0].type == "مشرف"? ` AND type="مستخدم"`: ""}`,
        orderedBy:`"${key.replace(/"/g , '\\"')}"`
    });
    res.status(200).json(users);
};


exports.search = catchAsync(async(req , res , next)=>{
    const searchFor = req.query.for;
    if(typeof searchFor != "string" || !["products" , "classifications" , "users"].includes(searchFor))
        throw new error({queryProperty:"for" , errMessage:`القيمة ${searchFor} غير صالحة`});

    req.query.key = String.prototype.trim.call(req.query.key);
    if(!req.query.key && req.query.key !== 0)
        throw new error({queryProperty:"key" , errMessage:`القيمة ${req.query.key} غير صالحة.`});

    req.query.key = insensitiveReplace(req.query.key , req.user[0].type);
    next();

   
});

exports.searchFor = catchAsync(async(req , res , next)=>{

    const searchFor = req.query.for;
    
    if(searchFor == "products"){
        await searchForProducts(req , res , next);

    }else{
        req.query.key = removeFullTextOperators(req.query.key);

        if(searchFor == "classifications")
    
            await searchForClassifications(req , res , next);
    
        else if(searchFor == "users")
    
            await searchForUsers(req , res , next);

        else

            throw new error({queryProperty:"searchFor" , errMessage:`القيمة ${searchFor} غير صالحة`} , 1252 , 400 , true);
        
    } 

    
});

/*  if(searchFor == "products"){
        

    }else if(searchFor == "classifications"){

        

    }else if(searchFor == "users"){

        

    }; */

// Product page - limit:  response ==> name + id + className  , requestBody ==> {name , classId , price , quantity , purchased} || requestParams ==> {name , classId , price};
// classifications page - limit: respponse ==> name + id  ,  requestBody ==>{name} || requestParams ==>{name};

// product params {key , filters(classId , price ) , for admin there is also id}
// class params {key , for admin there is also id}
// user params {key , phoneNumber , id}

// search?for=classifications
// search?for=products
// search?for=users

// permission
// users page - limit: response ==> name + phoneNumber + id;
