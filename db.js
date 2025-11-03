const mysql = require('mysql2');

// Create connection
const db = mysql.createConnection({
  host: 'localhost',       // your MySQL host
  user: 'root',            // your MySQL username
  password: '',            // your MySQL password (if any)
  database: 'nexus-mid'    // your imported database name
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to MySQL database: nexus-mid');
  }
});

module.exports = db;