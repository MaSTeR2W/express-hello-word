exports.validateString = (fieldName , fieldValue , minLength , maxLength)=>{

    if(typeof fieldValue != "string")
        return {
            fieldName, 
            errMessage:`يجب أن تكون البيانات من النوع string. نوع البيانات المدخل: ${typeof fieldValue}`
        };

    if(fieldValue.length > maxLength)
        return {
            fieldName, 
            errMessage:`يجب أن لا يتجاوز طول النص ${maxLength} حرفا`
        };

    if(fieldValue.length < minLength)
        return {
            fieldName,
            errMessage:`يجب أن لا يقل طول النص عن ${minLength} حرفا`
        };
};


exports.validateStringWithErrors = (fieldName , value , maxLength , minLength , errors) =>{
    if(typeof value != "string")
        errors.push({
            fieldName, 
            errMessage:`يجب أن تكون البيانات من النوع string. نوع البيانات المدخل: ${typeof value}`
        });

    else if(value.length > maxLength)
        errors.push({
            fieldName, 
            errMessage:`يجب أن لا يتجاوز طول النص ${maxLength} حرفا`
        });

    else if(value.length < minLength)
        errors.push({
            fieldName,
            errMessage:`يجب أن لا يقل طول النص عن ${minLength} حرفا`
        });
};