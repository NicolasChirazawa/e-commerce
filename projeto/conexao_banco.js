const initOptions = {/* Insira aqui*/};
const pgp = require('pg-promise')(initOptions);

const connectionObject = {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
}

const db = pgp(connectionObject);

module.exports = db;