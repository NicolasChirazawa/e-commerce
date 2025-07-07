async function main() {

    const express = require('express');
    const app = express();
    const port = process.env.SERVER_PORT;

    const { testarConexaoBanco } = require('./test/verificacaoBanco.js');
    const db = require('./projeto/conexao_banco.js');
    if(await testarConexaoBanco(db) === false) { return }
        
    app.listen(port, () => {
        console.log(`Server conectado na porta ${port}`);
    });
}

main();