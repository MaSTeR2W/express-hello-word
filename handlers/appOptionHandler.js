const AppOption = require("./../models/applicationOption");

exports.createOptionIfNotExist = async()=>{
    const option = await AppOption.selectOne({});

    if(option.length != 0)
        return global.ApplicationOption = option[0];

    global.ApplicationOption = (await AppOption.insertOne(
        {
            maximumCartItems:20,
            maximumOrdersPerUser:3,
            dailyMessageLimit:12,
            monthlyMessageLimit:25,
            shopStatus:"مفتوح"
        }, 
    
        {
            cols:"*",
            where:"optionId=1"
        }
    ))[0];

};