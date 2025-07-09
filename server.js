async function main() {

    const express = require('express');
    const app = express();
    const port = process.env.SERVER_PORT || 3000;

    app.use(express.json())

    const { testarConexaoBanco } = require('./test/verificacaoBanco.js');
    const db = require('./projeto/conexao_banco.js');
    if(await testarConexaoBanco(db) === false) { return }
    
    let user = require('./projeto/controllers/user.js');
    app.post('/registerUser', user.registerUser);

    app.listen(port, () => {
        console.log(`Server conectado na porta ${port}`);
    });
}
main();