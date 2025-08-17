async function testPostgresConnection(db) {
    try {
        const valor = await db.connect();
        valor.done();
        console.log('Conexão com o banco realizada com sucesso');
        return true;
    } catch(e) {
        console.log('Erro ao tentar conectar com o banco');
        console.log(e);
        return false;
    }
}

module.exports = { testPostgresConnection }