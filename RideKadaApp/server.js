// server.js
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());
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
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: 'Invalid email or password.' });
    }
  });
});

// ✅ GET DRIVERS route - fetches active drivers with vehicle info
app.get('/api/drivers', (req, res) => {
  const sql = `
    SELECT 
      d.DriverID,
      d.PhoneNumber,
      d.Fname,
      d.Lname,
      d.Email,
      d.Status,
      d.Destination,
      v.VehicleID,
      v.PlateNumber,
      v.Model,
      v.Color,
      v.Capacity
    FROM driver d
    LEFT JOIN vehicle v ON d.VehicleID = v.VehicleID
    WHERE d.Status = 'Active'
    ORDER BY d.Fname, d.Lname
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Query error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching drivers.',
        error: err.message 
      });
    }

    res.json(results);
  });
});

// ✅ SEARCH DRIVERS route - with search filter
app.get('/api/drivers/search', (req, res) => {
  const searchTerm = req.query.q || '';
  
  const sql = `
    SELECT 
      d.DriverID,
      d.PhoneNumber,
      d.Fname,
      d.Lname,
      d.Email,
      d.Status,
      d.Destination,
      v.VehicleID,
      v.PlateNumber,
      v.Model,
      v.Color,
      v.Capacity
    FROM driver d
    LEFT JOIN vehicle v ON d.VehicleID = v.VehicleID
    WHERE d.Status = 'Active'
    AND (
      d.Fname LIKE ? OR 
      d.Lname LIKE ? OR 
      d.PhoneNumber LIKE ? OR 
      d.Destination LIKE ?
    )
    ORDER BY d.Fname, d.Lname
  `;

  const searchPattern = `%${searchTerm}%`;
  
  db.query(sql, [searchPattern, searchPattern, searchPattern, searchPattern], (err, results) => {
    if (err) {
      console.error('❌ Query error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error searching drivers.',
        error: err.message 
      });
    }

    res.json(results);
  });
});

// Start the server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

