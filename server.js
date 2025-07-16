async function main() {

    const express = require('express');
    const app = express();
    const port = process.env.SERVER_PORT || 3000;

    app.use(express.json())

    const db = require('./projeto/bd_connection.js');
    const { testarConexaoBanco } = require('./test/verificacaoBanco.js');
    if(await testarConexaoBanco(db) === false) { return }
    
    const user = require('./projeto/Router/user.js');
    const product = require('./projeto/Router/product.js');
    app.use('/v1/', user);
    app.use('/v1/', product);

    app.listen(port, () => {
        console.log(`Server conectado na porta ${port}`);
    });
}
main();