const mysqlHandler = require("./../mysqlHandler-demo/mysqlHandler");

const shoppingCartTable = {
    userId:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true
    },
    productId:{
        type:"number",
        dataType:"MEDIUMINT",
        unsigned:true
    },
    quantity:{
        type:"number",
        dataType:"SMALLINT",
        unsigned:true
    },
    index:{
        indexers:[
            {
                iName:"cart_userId" , iCol:"userId"
            }
        ]
    }
};

const Cart = new mysqlHandler.createTable(shoppingCartTable , "carts");

module.exports = Cart;