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
    app.post('/loginUser', user.loginUser);
    app.get('/user', user.selectAllUsers);
    app.get('/user/:user_id', user.selectUser);
    // app.delete('/user/:user_id', user.deleteUser);

    app.listen(port, () => {
        console.log(`Server conectado na porta ${port}`);
    });
}
main();