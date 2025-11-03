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
app.post('/register', (req, res) => {
  const { Fname, Lname, Email, Password, PhoneNumber } = req.body;

  console.log('📩 Registration data received:', req.body);

  if (!Fname || !Lname || !Email || !Password || !PhoneNumber) {
    console.log('⚠️ Missing fields');
    return res.json({ success: false, message: 'Please fill in all fields.' });
  }

  const checkEmail = 'SELECT * FROM user WHERE Email = ?';
  db.query(checkEmail, [Email], (err, results) => {
    if (err) {
      console.error('❌ Email check failed:', err);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }

    if (results.length > 0) {
      console.log('⚠️ Email already exists:', Email);
      return res.json({ success: false, message: 'Email already registered.' });
    }

    const insertQuery = `
      INSERT INTO user (Fname, Lname, Email, Password, PhoneNumber, PCount)
      VALUES (?, ?, ?, ?, ?, 0)
    `;
    db.query(insertQuery, [Fname, Lname, Email, Password, PhoneNumber], (err2, result) => {
      if (err2) {
        console.error('❌ Insert failed:', err2);
        return res.status(500).json({ success: false, message: 'Failed to register user.' });
      }

      console.log('✅ User registered successfully:', result.insertId);
      res.json({ success: true, message: 'User registered successfully!' });
    });
  });
});
// Start the server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

