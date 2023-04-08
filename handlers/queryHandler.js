const error = require("./../utilities/error");
const {catchAsync} = require("./../utilities/catchFun");
const {getType} = require("./../utilities/auxiliaryFunctions");
const Product = require("./../models/productModel");

const isNumberValid = (price , property)=>{
    if(isNaN(Number(price)))
        return {queryProperty:property , errMessage:`يجب أن ${property} من النوع number`};

    else if(price.length > 10)
        return {queryProperty:property , errMessage:`يجب أن لا يتجاوز ${property} 10 أرقام`};

    else if(price < 0)
        return {queryProperty:property , errMessage:`يجب أن يكون ${property} عدداً موجباً`};
};

exports.isNumberValid = isNumberValid;

exports.validatePageNumber = catchAsync(async(req , res , next)=>{
    const page = req.query.page? req.query.page == 0 || req.query.page == ''? 1 : req.query.page : 1;
    const limit = req.query.limit? req.query.limit == 0 || req.query.limit == ""? 8 : req.query.limit : 8;
    const errors = [];

    if(isNaN(page-0))
        errors.push({queryProperty:"page" , errMessage:`رقم الصفحة (${page}) غير صالح`});
        
    
    if(isNaN(limit-0) || limit > 20)
        errors.push({queryProperty:"limit" , errMessage:`قيمة الحد ${limit} غير صالحة.`});
        
    if(errors.length > 0)    
        throw new error(errors , 1007 , 400 , true);

    req.offset = (page - 1) * limit;
    req.limit = limit;
    next();
});

exports.validateUserQuery = catchAsync(async(req , res , next)=>{
    const status = req.query.status;
    const type = req.query.type;
    const errors = [];

    const where = [];

    if(status){
        if(typeof status != "string")
            errors.push({queryProperty:"status" , errMessage:`نوع البيانات (${typeof status}) غير صالح`});

        else if(!["مفعل" , "غير مفعل" , "محظور"].includes(status))
            errors.push({queryProperty:"status" , errMessage:`القيمة (${status}) غير صحيحة. القيم الصحيحة هي: (مفعل , غير مفعل , محظور)`});

        else
            where.push(`status="${status}"`);
    }else{
        where.push('status<>"محذوف"');
    };

    if(type){
        if(typeof type != "string")
            errors.push({queryProperty:"type" , errMessage:`نوع البيانات (${typeof type}) غير صالح`});

        else{
            if(type == "مستخدم")
                where.push('type="مستخدم"');

            else if(type == "مشرف"){
                if(req.user[0].type != "مسؤول")
                    errors.push({queryProperty:"type" , errMessage:"ليس لديك صلاحيات للاستعلام عن المشرفين"});
                else
                    where.push('type="مشرف"');
            }else
                errors.push({queryProperty:"type" , errMessage:`القيمة (${type}) غير صحيحة. القيم الصحيحة: (مستخدم , مشرف).`});
        };
    }else{
        if(req.user[0].type == "مسؤول")
            where.push('type<>"مسؤول"');

        else
            where.push('type="مستخدم"');
    };

    if(errors.length > 0)
        throw new error(errors , 1005 , 400 , true);

    req.where = where.join(" AND ");

    next();


});

exports.validateProductsQuery = catchAsync(async(req , res , next)=>{
    const query = req.query;
    const errors = [];
    const where = [];

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

    if(query.orderedBy){
        const orderedBy = query.orderedBy;

        if(typeof orderedBy != "string")
            errors.push({queryProperty:"orderedBy" , errMessage:"يجب أن تكون قيمة الخاصية من النوع string"});

        else{
            if(!Product.tableCols.includes(orderedBy))
                errors.push({queryProperty:"orderedBy" , errMessage:"قيمة الخاصية غير صحيحة"});

            else{
                req.orderedBy = orderedBy;

                if(query.sort){
                    const sort = query.sort;
                    if(typeof sort != "string")
                        errors.push({queryProperty:"sort" , errMessage:"يجب أن تكون قيمة الخاصية من النوع string"});
                    
                    else if(sort.toUpperCase() == "DESC"){
                        req.descending = true;
                    };
                };
            };
        }
    };

    if(errors.length > 0)
        throw new error(errors , 1035 , 400 , true);

    req.where = where.join(" AND ");

    next();
});

exports.validateOrdersQuery = catchAsync(async(req , res , next)=>{
    const query = req.query;
    const user = req.user;
    req.where = [];
    const errors = [];

    if(query.userId){
        const validateUserId = isNumberValid(query.userId , "userId");
        if(validateUserId instanceof Object)
            errors.push(validateUserId);

        else{

            if(user[0].userId == query.userId)
                req.where.push(`orders.userId=${query.userId}`);

            else if(user[0].type == "مستخدم")
                throw new error("ليس لديك الصلاحية للولوج" , 1161 , 403 , true);

            else if(user[0].type == "مشرف")
                req.where.push(`orders.userId=${query.userId} AND users.type="مستخدم"`);
            
            else
                req.where.push(`orders.userId=${query.userId}`);
            
        };
    }else if(user[0].type == "مستخدم"){

        req.where.push(`orders.userId=${user[0].userId}`);

    }else if(user[0].type == "مشرف"){

        req.where.push(`users.type="مستخدم" OR orders.userId=${user[0].userId}`);
        
    };

    if(query.status){
        if(typeof query.status == "string"){

            let status , operation="=";
            if(query.status.startsWith("-")){
                status = query.status.slice(1);
                operation="<>";
            }else{
                status = query.status;
            };

            if(!["معلق" , "جارٍ الإنجاز" , "ملغي" , "مُنجز"].includes(status))
                errors.push({queryProperty:"status" , errMessage:`قيمة ال status (${status}) غير صالحة.`});
            else 
                req.where.push(`orders.status${operation}"${status}"`);

        }else if(getType(query.status) == "array"){
            const values = [];
            if(query.status.length > 4 || query.status.length != new Set(query.status).size)
                errors.push({queryProperty:"status" , errMessage:"المصفوفة غير صالحة"});
            
                else{

                for(let i = 0 ; i < query.status.length ; i++){
                    
                    let status , operation="=";
                    if(query.status[i].startsWith("-")){
                        status = query.status[i].slice(1);
                        operation="<>";
                    }else{
                        status = query.status[i];
                    };

                    if(!["معلق" , "جارٍ الإنجاز" , "ملغي" , "مُنجز"].includes(status))
                        errors.push({queryProperty:"status" , errMessage:`قيمة ال status (${status}) غير صالحة.`});
                    else 
                        values.push(`orders.status${operation}"${status}"`); 
                };

                req.where.push(`(${values.join(" OR ")})`);
            };
        };
    };

    if(query.year || query.month || query.day){
        const now = new Date();

        let startDate;

        let endDate;

        if(query.day){
            
            startDate = new Date(now.getFullYear()+ "-" +(now.getMonth()+1));

            endDate = new Date(now.getFullYear()+ "-" +(now.getMonth()+1));

            

            query.year && startDate.setFullYear(query.year) && endDate.setFullYear(query.year);
            query.month && startDate.setMonth(query.month-1) && endDate.setMonth(query.month-1);

            startDate.setDate(query.day);
            endDate.setDate((query.day-0+1));

        }else if(query.month){
            startDate = new Date(now.getFullYear()+"");
            endDate = new Date(now.getFullYear()+"");

            query.year && startDate.setFullYear(query.year) && endDate.setFullYear(query.year);
            
            startDate.setMonth(query.month-1);
            endDate.setMonth(query.month);

        }else if(query.year){
            startDate = new Date(query.year + "");
            endDate = new Date((query.year-0+1) + "");
            
        };
        

        if(isNaN(startDate.getDate()) || isNaN(endDate.getDate()))
            errors.push({queryProperty:"year or month or day" , errMessage:"صيغة التاريخ غير صحيحة"});

        else
            req.where.push(`(orderedAt>="${startDate.getAntiISODate() + " 00:00:00"}" AND orderedAt<"${endDate.getAntiISODate() + " 00:00:00"}")`);
        
    };

    if(errors.length > 0)
        throw new error(errors , 1151 , 400 , true);

    next();
});

exports.validateDateQuery = catchAsync(async(req , res , next)=>{
    const now = new Date();
    const query = req.query;

    let startDate;

    let endDate;


    if(query.day){
            
        startDate = new Date(now.getFullYear()+ "-" +(now.getMonth()+1));

        endDate = new Date(now.getFullYear()+ "-" +(now.getMonth()+1));

        

        query.year && startDate.setFullYear(query.year) && endDate.setFullYear(query.year);
        query.month && startDate.setMonth(query.month-1) && endDate.setMonth(query.month-1);

        startDate.setDate(query.day);
        endDate.setDate((query.day-0+1));

    }else if(query.month){
        startDate = new Date(now.getFullYear()+"");
        endDate = new Date(now.getFullYear()+"");

        query.year && startDate.setFullYear(query.year) && endDate.setFullYear(query.year);
        
        startDate.setMonth(query.month-1);
        endDate.setMonth(query.month);

    }else if(query.year){
        startDate = new Date(query.year + "");
        endDate = new Date((query.year-0+1) + "");
        
    };
        
    if(startDate && (isNaN(startDate.getDate()) || isNaN(endDate.getDate())))
        throw new error({queryProperty:"year or month or day" , errMessage:"صيغة التاريخ غير صحيحة"} , 1151 , 400 , true);
    else if(!startDate)
        return next();

    req.where = (`(A.orderedAt>="${startDate.getAntiISODate() + " 00:00:00"}" AND A.orderedAt<"${endDate.getAntiISODate() + " 00:00:00"}")`);

    next();
});