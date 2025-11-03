const express = require('express');
const db = require('./db');
const app = express();
const PORT = 3000;

// Route to show all drivers
app.get('/drivers', (req, res) => {
  const sql = 'SELECT * FROM driver';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Query failed:', err);
      res.status(500).send('Error fetching data');
    } else {
      res.json(results);
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});