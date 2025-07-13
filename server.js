async function main() {

    const express = require('express');
    const app = express();
    const port = process.env.SERVER_PORT || 3000;

    app.use(express.json())

    const db = require('./projeto/bd_connection.js');
    const { testarConexaoBanco } = require('./test/verificacaoBanco.js');
    if(await testarConexaoBanco(db) === false) { return }
    
    let user = require('./projeto/Router/user.js');
    app.use('/v1/', user);

    app.listen(port, () => {
        console.log(`Server conectado na porta ${port}`);
    });
}
main();