const Redis = require('ioredis');

const connectionObject = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
}

const redisConnection = new Redis(connectionObject);

redisConnection.on("connect", () => {
    console.log("Conectado com sucesso");
})

redisConnection.on("error", (err) => {
    console.log(`Erro ao conectar com o Redis ${err}`)
})

module.exports = { connectionObject };