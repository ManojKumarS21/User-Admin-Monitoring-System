require('dotenv').config({ path: './backend/.env' });
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.error("❌ Connection failed:", err.message);
        process.exit(1);
    }
    console.log("✅ Connected to MySQL");
    db.query('SHOW TABLES', (err, rows) => {
        if (err) console.error(err);
        else console.log("Tables:", rows);
        db.end();
    });
});
