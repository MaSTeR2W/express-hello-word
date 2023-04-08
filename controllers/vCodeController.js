const VCodeIPLimit = require("./../models/vCodeIPLimit");
const error = require("./../utilities/error");

exports.updateVCodeIPLimit = async(req , ip)=>{

    ip || (ip = await VCodeIPLimit.selectOne({} , {where:`ip="${req.ip}"`}));
    if(ip.length > 0){
        
        const updateBody = {};
        if(ip[0].status == "محظور") throw new error("لقد تم حظرك من طلب رسائل تحقق. يرجى الاتصال بالدعم الفني" , 700 , 403 , true);

        const lastVCode = new Date(ip[0].lastVCode);

        if(lastVCode > new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).getCurrentTime()){
            if(ip[0].monthlyVCodeTimes >= ApplicationOption.monthlyMessageLimit){
                await VCodeIPLimit.update({
                    status:"محظور"
                } , `ip="${ip[0].ip}"`);
                throw new error("لقد تم حظرك من طلب رسائل تحقق. يرجى الاتصال بالدعم الفني" , 700 , 403 , true);
            };
            updateBody.monthlyVCodeTimes = ip[0].monthlyVCodeTimes-0+1;
        }else{
            updateBody.monthlyVCodeTimes = 1;
        };

        if(lastVCode > new Date(Date.now() - 1000 * 60 * 60 * 24).getCurrentTime()){

            if(ip[0].dailyVCodeTimes >= ApplicationOption.dailyMessageLimit){

                throw new error("لقد وصلت إلى الحد الأقصى لعدد رسائل التحقق اليومي يرجى المحاولة غدا" , 707 , 405 , true);

            }else{
                updateBody.dailyVCodeTimes = ++ip[0].dailyVCodeTimes;
            };
        }else{
            updateBody.dailyVCodeTimes = 1;
        };
        updateBody.lastVCode = new Date();
        await VCodeIPLimit.update(updateBody , `ip="${ip[0].ip}"`);
    }else{
        await this.createVCodeIPLimit(req , ip);
    }
}
exports.createVCodeIPLimit = async(req , ip)=>{

    ip || (ip = await VCodeIPLimit.selectOne({} , {where:`ip="${req.ip}"`}));
    if(ip.length == 0){
        await VCodeIPLimit.insertOne({
            ip:req.ip,
            lastVCode: new Date()
        });
    }else{
        await this.updateVCodeIPLimit(req , ip);
    };
};

exports.checkVCodeLimit = async(user , body , req)=>{

    if(new Date(user[0].lastVCode) > new Date(Date.now() - 1000 * 60 * 5).getCurrentTime()){
        
        if(user[0].vCodeTimes >= 3) 
        throw new error("وصلت إلى الحد الاقصى لعدد رسائل التحقق. حاول مرة أخرى بعد 5 دقائق" , 770 , 405 , true);
        
        body.vCodeTimes = user[0].vCodeTimes-0+1;
        
    }else{
        body.vCodeTimes = 1;
    };
    await this.createVCodeIPLimit(req);
};

exports.checkVCode = (user , body)=>{

    const now = new Date().getCurrentTime();
    if(new Date(user[0].vCodeExp) < now) throw new error({
        fieldName:"vCode",
        errMessage:"انتهت صلاحية الرمز. اطلب رمزا جديداً"
    } , 137 , 400 , true);

    if(user[0].vCode == "NULL") throw new error({
        fieldName:"vCode",
        errMessage:"عليك طلب رمز أولا"
    } , 152 , 400 , true);

    if(user[0].vCode !== body.vCode) throw new error({
        fieldName:"vCode",
        errMessage:"الرمز غير صحيح"
    } , 142 , 400 , true);
};