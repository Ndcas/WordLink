const { Sequelize } = require('sequelize');

let dbName = process.env.DB_NAME;
let dbUser = process.env.DB_USER;
let dbPass = process.env.DB_PASSWORD;
let dbHost = process.env.DB_HOST;
let dbPort = process.env.DB_PORT;

const db = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = db;