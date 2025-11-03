// server.js
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // use your WAMP password if set
  database: 'nexus-mid'
});

db.connect((err) => {
  if (err) console.error('❌ Database connection failed:', err.message);
  else console.log('✅ Connected to MySQL database: nexus-mid');
});

// ✅ LOGIN route
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: 'Please fill in all fields.' });
  }

  const sql = 'SELECT * FROM user WHERE Email = ? AND Password = ?';
  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error('❌ Query error:', err);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }

    if (results.length > 0) {
      const user = results[0];
      res.json({ success: true, user }); // matches your script.js format
    } else {
      res.json({ success: false, message: 'Invalid email or password.' });
    }
  });
});

// Start the server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));