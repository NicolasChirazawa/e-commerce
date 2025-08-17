const Redis = require('ioredis');

const connectionObject = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
}

const redisConnection = new Redis(connectionObject, { maxRetriesPerRequest: 2 });

module.exports = { redisConnection };