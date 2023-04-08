const crypto = require("crypto");
const {promisify} = require("util");
const key = process.env.ENCRYPT_SECRET;
const iv = Buffer.from(process.env.IV , "utf8");
const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";


exports.hashPassword = async(password , salt)=>{
    const pass = await promisify(crypto.scrypt)(password , salt , 256);
    return (await promisify(crypto.scrypt)(pass , process.env.PAPPER , 192)).toString("base64url");
}

exports.randomChar = ()=>{
    return chars[Math.floor(Math.random() * 62)];
};

exports.randomString = (length , replace)=>{
    length = length / 8 * 6;
    const random = crypto.randomBytes(length).toString("base64url");
    if(replace){
        let newText = '';
        for(let i = 0 ; i < random.length ; i++){
             newText += random[i] == "-" || random[i] == "_"? this.randomChar():random[i];
        };
        return newText;
    };
    return random;
};


exports.aesEncrypt = async(text)=>{
    const aes_enc = crypto.createCipheriv('aes256' , key , iv);
    let encrypted = aes_enc.update(text, 'utf8', 'base64');
    encrypted += aes_enc.final('base64');
    return encrypted;
};

exports.aesDecrypt = async(cipherText)=>{
    const aes_dec = crypto.createDecipheriv('aes256' , key , iv);
    let decrypted = aes_dec.update(cipherText, 'base64', 'utf8');
    return (decrypted + aes_dec.final('utf8'));
};

