exports.catchAsync = (fn)=>{
    return (req , res , next)=>{
        fn(req , res , next).catch(next);
    }
}

exports.catchSync = fn => {
    return (req , res , next) =>{
        try{
            fn(req , res , next)
        }catch(err){
            next(err);
        }
    } 
}