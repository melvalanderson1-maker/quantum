const mysql = require("mysql2/promise");
const path = require("path");
const dotenv = require("dotenv");

// 🔥 FORZAR ruta absoluta correcta
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// DEBUG REAL
console.log("ENV CHECK:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "OK" : "MISSING");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});

module.exports = pool;