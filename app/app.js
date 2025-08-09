async function main() {

    const express = require('express');
    const app = express();
    const port = process.env.SERVER_PORT || 3000;

    app.use(express.json());

    const db = require('./bd_connection.js');
    const { testarConexaoBanco } = require('../test/bd_verification.js');
    if(await testarConexaoBanco(db) === false) { return }
    
    const users =         require('./router/user.js');
    const products =      require('./router/product.js');
    const shooping_cart = require('./router/shoppingCart.js');
    const payment =       require('./router/payment.js');
    
    app.use('/v1/', users);
    app.use('/v1/', products);
    app.use('/v1/', shooping_cart);
    app.use('/v1/', payment);

    app.listen(port, () => {
        console.log(`Server conectado na porta ${port}`);
    });
}
main();