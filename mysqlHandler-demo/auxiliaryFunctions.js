const selectIntervally =(getSession , interval , isConnected)=>{
    return new Promise((res , rej)=>{
        const random = (Math.floor(Math.random() * 8) + interval) * 10000;
        setTimeout(()=>{
            if(isConnected()) getSession().execute("select 1");
            res(random);
        } , random);
    });
}
exports.stayConnected = (getSession , interval , isConnected)=>{
    selectIntervally(getSession , interval , isConnected).then((res)=>{
        return selectIntervally(getSession , interval , isConnected);
    });
};

const wait = (ms)=>{
    return new Promise(res =>{
        setTimeout(res , ms);
    });
}

exports.wait = wait;

const waitingConnection = (getSession)=>{
    let attempts = 0;
    return new Promise((res , rej)=>{
        const id = setInterval(()=>{
            attempts++;
            if(getSession() && !(getSession() instanceof Promise)){
                res();
                clearInterval(id);   
            };
            if(attempts > 100) rej("Exceed the limit of attempting to wait connection");
        } , 100);
    });
}

exports.waitingConnection =  waitingConnection


const getType = (variable)=>{
    const type = Object.prototype.toString.call(variable);
    return type.slice(8 , type.length - 1).toLowerCase();
};

exports.getType = getType;


const isQuoteEscaped = (str)=>{
    for(let i = 0 ; i < str.length ; i++){
        if(str[i] == "'"){

            for(let j = i-1; j > -1 ; j--){

                if(str[j] != "\\"){
                    if((i - j) % 2 != 0) 
                        return false;
                    else
                        j = -1;
                };

            };
        };

    };
    return true;
};

exports.isQuoteEscaped = isQuoteEscaped;
