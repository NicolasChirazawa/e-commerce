async function main() {

    const express = require('express');
    const app = express();
    const port = process.env.SERVER_PORT || 3000;

    app.use(express.json())

    const db = require('./bd_connection.js');
    const { testarConexaoBanco } = require('../test/verificacaoBanco.js');
    if(await testarConexaoBanco(db) === false) { return }
    
    const users = require('./Router/user.js');
    const products = require('./Router/product.js');
    app.use('/v1/', users);
    app.use('/v1/', products);

    app.listen(port, () => {
        console.log(`Server conectado na porta ${port}`);
    });
}
main();