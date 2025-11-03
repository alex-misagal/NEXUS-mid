const mysql = require('mysql2');

// Create a connection to your WAMP MySQL server
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // leave empty if WAMP has no MySQL password
  database: 'nexus-mid' // must match your imported DB name
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ Connected to MySQL database: nexus-mid');
  
  // Query data from the 'driver' table
  const query = 'SELECT * FROM driver';

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Query failed:', err.message);
      return;
    }

    console.log('🚗 Driver Data:');
    console.table(results); // prints rows in a table format

    db.end(); // close connection after use
  });
});