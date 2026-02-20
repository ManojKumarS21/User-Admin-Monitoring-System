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
    db.query("DESCRIBE users", (err, rows) => {
        if (err) {
            console.error("❌ Error describing table:", err.message);
        } else {
            console.log("Table structure:");
            console.table(rows);
            const hasColumn = rows.some(row => row.Field === 'hackerrank_username');
            if (hasColumn) {
                console.log("✅ Column 'hackerrank_username' exists.");
            } else {
                console.log("❌ Column 'hackerrank_username' is MISSING.");
            }
        }
        db.end();
    });
});
