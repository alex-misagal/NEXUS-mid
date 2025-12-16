// RideKada Admin Panel - Node.js Backend
// Team NEXUS - IT/CS 311

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: 'ridekada-admin-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nexus-mid',
  port: 3306
};

let pool;

// Initialize database connection
async function initializeDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log('✓ Connected to MySQL database');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin (
        AdminID INT PRIMARY KEY AUTO_INCREMENT,
        Username VARCHAR(50) UNIQUE NOT NULL,
        Password VARCHAR(255) NOT NULL,
        Email VARCHAR(100),
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.query(`
      ALTER TABLE driver 
      MODIFY COLUMN Status ENUM('Active', 'Suspended', 'Inactive', 'Pending', 'Declined') 
      DEFAULT 'Pending'
    `);

    const [admins] = await connection.query('SELECT COUNT(*) as count FROM admin');
    if (admins[0].count === 0) {
      await connection.query(`
        INSERT INTO admin (Username, Password, Email) 
        VALUES ('admin', 'admin123', 'admin@ridekada.com')
      `);
      console.log('✓ Default admin created (username: admin, password: admin123)');
    }
    
    connection.release();
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    setTimeout(initializeDatabase, 5000);
  }
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'Unauthorized. Please login.'
    });
  }
}

// ===== AUTHENTICATION ROUTES =====

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password required'
      });
    }
    
    const [rows] = await pool.query(
      'SELECT AdminID, Username, Email FROM admin WHERE Username = ? AND Password = ?',
      [username, password]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    req.session.adminId = rows[0].AdminID;
    req.session.username = rows[0].Username;
    
    res.json({
      success: true,
      message: 'Login successful',
      admin: {
        username: rows[0].Username,
        email: rows[0].Email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

app.get('/api/admin/check-session', (req, res) => {
  if (req.session && req.session.adminId) {
    res.json({
      success: true,
      authenticated: true,
      username: req.session.username
    });
  } else {
    res.json({
      success: true,
      authenticated: false
    });
  }
});

// ===== DASHBOARD STATS =====

app.get('/api/admin/dashboard-stats', requireAuth, async (req, res) => {
  try {
    const [activeDrivers] = await pool.query(
      "SELECT COUNT(*) as count FROM driver WHERE Status = 'Active'"
    );
    
    const [passengers] = await pool.query('SELECT COUNT(*) as count FROM user');
    
    const [earnings] = await pool.query(
      "SELECT COALESCE(SUM(Amount), 0) as total FROM payment WHERE Status = 'Completed'"
    );
    
    const [expenses] = await pool.query(
      "SELECT COALESCE(SUM(TotalFare), 0) as total FROM booking WHERE Status = 'Completed'"
    );
    
    const [availableRides] = await pool.query(
      "SELECT COUNT(*) as count FROM driver WHERE Status = 'Active'"
    );
    
    const totalUsers = activeDrivers[0].count + passengers[0].count;
    
    res.json({
      success: true,
      stats: {
        activeDrivers: activeDrivers[0].count,
        registeredPassengers: passengers[0].count,
        totalEarnings: parseFloat(earnings[0].total),
        announcements: 1,
        totalExpenses: parseFloat(expenses[0].total),
        availableRides: availableRides[0].count,
        totalUsers: totalUsers
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
});

app.get('/api/admin/earnings/monthly', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        DATE_FORMAT(PaymentDate, '%Y-%m') AS month,
        SUM(Amount) AS total
      FROM payment
      WHERE Status = 'Completed'
      GROUP BY month
      ORDER BY month
    `);

    res.json({
      success: true,
      earnings: rows
    });
  } catch (error) {
    console.error('Monthly earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly earnings'
    });
  }
});

// ===== USER MANAGEMENT ROUTES =====

app.get('/api/admin/users', requireAuth, async (req, res) => {
  try {
    const { userType } = req.query;
    
    let rows = [];
    
    if (userType === 'Driver') {
      const [drivers] = await pool.query(`
        SELECT 
          DriverID as id,
          Fname,
          Lname,
          Email,
          PhoneNumber,
          'Driver' as UserType,
          Status
        FROM driver
        ORDER BY Fname
      `);
      rows = drivers;
      
    } else if (userType === 'Passenger') {
      const [passengers] = await pool.query(`
        SELECT 
          UserID as id,
          Fname,
          Lname,
          Email,
          PhoneNumber,
          'Passenger' as UserType
        FROM user
        ORDER BY Fname
      `);
      rows = passengers;
      
    } else if (userType === 'Admin') {
      const [admins] = await pool.query(`
        SELECT 
          AdminID as id,
          Username as Fname,
          '' as Lname,
          Email,
          '' as PhoneNumber,
          'Admin' as UserType
        FROM admin
        ORDER BY Username
      `);
      rows = admins;
      
    } else {
      const [passengers] = await pool.query(`
        SELECT 
          UserID as id,
          Fname,
          Lname,
          Email,
          PhoneNumber,
          'Passenger' as UserType
        FROM user
      `);
      const [drivers] = await pool.query(`
        SELECT 
          DriverID as id,
          Fname,
          Lname,
          Email,
          PhoneNumber,
          'Driver' as UserType,
          Status
        FROM driver
      `);
      const [admins] = await pool.query(`
        SELECT 
          AdminID as id,
          Username as Fname,
          '' as Lname,
          Email,
          '' as PhoneNumber,
          'Admin' as UserType
        FROM admin
      `);
      
      rows = [...passengers, ...drivers, ...admins];
      rows.sort((a, b) => a.UserType.localeCompare(b.UserType) || a.Fname.localeCompare(b.Fname));
    }
    
    res.json({
      success: true,
      count: rows.length,
      users: rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

app.get('/api/admin/users/driver/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        d.DriverID,
        d.Fname,
        d.Lname,
        d.Email,
        d.PhoneNumber,
        d.Status,
        d.Destination,
        v.VehicleID,
        v.PlateNumber,
        v.Model,
        v.Color,
        v.Capacity
      FROM driver d
      LEFT JOIN vehicle v ON d.VehicleID = v.VehicleID
      WHERE d.DriverID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    res.json({
      success: true,
      user: rows[0]
    });
  } catch (error) {
    console.error('Error fetching driver details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver details',
      error: error.message
    });
  }
});

app.get('/api/admin/users/passenger/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT UserID, Fname, Lname, Email, PhoneNumber FROM user WHERE UserID = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Passenger not found'
      });
    }

    res.json({
      success: true,
      user: {
        UserID: rows[0].UserID,
        Fname: rows[0].Fname,
        Lname: rows[0].Lname,
        Email: rows[0].Email || '',
        PhoneNumber: rows[0].PhoneNumber
      }
    });
  } catch (error) {
    console.error('Error fetching passenger details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

app.put('/api/admin/users/driver/:id', requireAuth, async (req, res) => {
  try {
    const { Fname, Lname, Email, PhoneNumber, Password, Status, PlateNumber, Model, Color, Capacity } = req.body;
    const driverId = req.params.id;
    
    let updateDriverQuery = `
      UPDATE driver 
      SET Fname = ?, Lname = ?, Email = ?, PhoneNumber = ?
    `;
    let driverParams = [Fname, Lname, Email, PhoneNumber];
    
    if (Password) {
      updateDriverQuery += ', Password = ?';
      driverParams.push(Password);
    }
    
    if (Status && ['Active', 'Suspended', 'Inactive', 'Pending', 'Declined'].includes(Status)) {
      updateDriverQuery += ', Status = ?';
      driverParams.push(Status);
    }
    
    updateDriverQuery += ' WHERE DriverID = ?';
    driverParams.push(driverId);
    
    await pool.query(updateDriverQuery, driverParams);
    
    if (PlateNumber || Model || Color || Capacity) {
      const [driver] = await pool.query('SELECT VehicleID FROM driver WHERE DriverID = ?', [driverId]);
      if (driver[0].VehicleID) {
        await pool.query(`
          UPDATE vehicle 
          SET PlateNumber = COALESCE(?, PlateNumber),
              Model = COALESCE(?, Model),
              Color = COALESCE(?, Color),
              Capacity = COALESCE(?, Capacity)
          WHERE VehicleID = ?
        `, [PlateNumber || null, Model || null, Color || null, Capacity || null, driver[0].VehicleID]);
      }
    }
    
    res.json({
      success: true,
      message: 'Driver updated successfully'
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver',
      error: error.message
    });
  }
});

app.put('/api/admin/users/passenger/:id', requireAuth, async (req, res) => {
  try {
    const { Fname, Lname, Email, PhoneNumber, Password } = req.body;
    const userId = req.params.id;
    
    let updateQuery = `
      UPDATE user 
      SET Fname = ?, Lname = ?, Email = ?, PhoneNumber = ?
    `;
    let params = [Fname, Lname, Email, PhoneNumber];
    
    if (Password) {
      updateQuery += ', Password = ?';
      params.push(Password);
    }
    
    updateQuery += ' WHERE UserID = ?';
    params.push(userId);
    
    await pool.query(updateQuery, params);
    
    res.json({
      success: true,
      message: 'Passenger updated successfully'
    });
  } catch (error) {
    console.error('Error updating passenger:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update passenger',
      error: error.message
    });
  }
});

app.delete('/api/admin/users/:type/:id', requireAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    
    if (type === 'driver') {
      await pool.query('DELETE FROM driver WHERE DriverID = ?', [id]);
    } else {
      await pool.query('DELETE FROM user WHERE UserID = ?', [id]);
    }
    
    res.json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// ===== NEW USERS (Pending) =====

app.get('/api/admin/new-users', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        d.DriverID,
        d.Fname,
        d.Lname,
        d.Email,
        d.PhoneNumber,
        'Driver' as UserType,
        d.Status,
        v.PlateNumber,
        v.Model,
        v.Color,
        v.Capacity
      FROM driver d
      LEFT JOIN vehicle v ON d.VehicleID = v.VehicleID
      WHERE d.Status = 'Pending'
      ORDER BY d.DriverID DESC
      LIMIT 20
    `);
    
    res.json({
      success: true,
      count: rows.length,
      users: rows
    });
  } catch (error) {
    console.error('Error fetching new users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch new users',
      error: error.message
    });
  }
});

app.post('/api/admin/users/accept/:id', requireAuth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE driver SET Status = 'Active' WHERE DriverID = ?",
      [req.params.id]
    );
    
    res.json({
      success: true,
      message: 'Driver accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept driver',
      error: error.message
    });
  }
});

app.post('/api/admin/users/decline/:id', requireAuth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE driver SET Status = 'Declined' WHERE DriverID = ?",
      [req.params.id]
    );
    
    res.json({
      success: true,
      message: 'Driver declined'
    });
  } catch (error) {
    console.error('Error declining driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline driver',
      error: error.message
    });
  }
});

// ===== TRANSACTION HISTORY ROUTES =====

// Get transaction stats
app.get('/api/admin/transactions/stats', requireAuth, async (req, res) => {
  try {
    const [totalPayments] = await pool.query(
      'SELECT COUNT(*) as count FROM payment'
    );
    
    const [completedPayments] = await pool.query(
      "SELECT COALESCE(SUM(Amount), 0) as total FROM payment WHERE Status = 'Completed'"
    );
    
    const [totalRides] = await pool.query(
      'SELECT COUNT(*) as count FROM ride'
    );
    
    res.json({
      success: true,
      stats: {
        totalTransactions: totalPayments[0].count,
        completedPayments: parseFloat(completedPayments[0].total),
        totalRides: totalRides[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction stats',
      error: error.message
    });
  }
});

// Get all payments
app.get('/api/admin/transactions/payments', requireAuth, async (req, res) => {
  try {
    const { method } = req.query;
    
    let query = `
      SELECT 
        PaymentID,
        BookingID,
        Amount,
        PaymentMethod,
        PaymentDate,
        Status
      FROM payment
    `;
    
    const params = [];
    
    if (method && method !== 'all') {
      query += ' WHERE PaymentMethod = ?';
      params.push(method);
    }
    
    query += ' ORDER BY PaymentDate DESC LIMIT 100';
    
    const [rows] = await pool.query(query, params);
    
    res.json({
      success: true,
      count: rows.length,
      payments: rows
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

// Get all rides
app.get('/api/admin/transactions/rides', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT 
        r.RideID,
        r.DateTime,
        r.Fare,
        r.Status,
        CONCAT(d.Fname, ' ', d.Lname) as DriverName,
        d.PhoneNumber as DriverPhone,
        CONCAT(u.Fname, ' ', u.Lname) as PassengerName,
        u.PhoneNumber as PassengerPhone
      FROM ride r
      LEFT JOIN driver d ON r.DriverID = d.DriverID
      LEFT JOIN user u ON r.UserID = u.UserID
    `;
    
    const params = [];
    
    if (status && status !== 'all') {
      query += ' WHERE r.Status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY r.DateTime DESC LIMIT 100';
    
    const [rows] = await pool.query(query, params);
    
    res.json({
      success: true,
      count: rows.length,
      rides: rows
    });
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rides',
      error: error.message
    });
  }
});

// Get payment details
app.get('/api/admin/transactions/payment/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM payment WHERE PaymentID = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    res.json({
      success: true,
      payment: rows[0]
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
});

// Get ride details
app.get('/api/admin/transactions/ride/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.*,
        CONCAT(d.Fname, ' ', d.Lname) as DriverName,
        d.PhoneNumber as DriverPhone,
        d.Email as DriverEmail,
        CONCAT(u.Fname, ' ', u.Lname) as PassengerName,
        u.PhoneNumber as PassengerPhone,
        u.Email as PassengerEmail
      FROM ride r
      LEFT JOIN driver d ON r.DriverID = d.DriverID
      LEFT JOIN user u ON r.UserID = u.UserID
      WHERE r.RideID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }
    
    res.json({
      success: true,
      ride: rows[0]
    });
  } catch (error) {
    console.error('Error fetching ride details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ride details',
      error: error.message
    });
  }
});

// ===== REPORTS & LOGS =====

app.get('/api/admin/reports/users', requireAuth, async (req, res) => {
  try {
    const reports = [
      {
        id: 1,
        userName: 'zyrus masaad',
        userType: 'Driver',
        complaint: 'Bugs',
        details: 'the aura was so great that ...',
        date: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      count: reports.length,
      reports: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
});

app.get('/api/admin/logs', requireAuth, async (req, res) => {
  try {
    const [newDrivers] = await pool.query(`
      SELECT 
        DriverID as id,
        CONCAT(Fname, ' ', Lname) as name,
        Email,
        PhoneNumber,
        'New Driver' as type
      FROM driver
      ORDER BY DriverID DESC
      LIMIT 5
    `);
    
    const [newPassengers] = await pool.query(`
      SELECT 
        UserID as id,
        CONCAT(Fname, ' ', Lname) as name,
        Email,
        PhoneNumber,
        'New Passenger' as type
      FROM user
      ORDER BY UserID DESC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      logs: {
        newDrivers: newDrivers,
        newPassengers: newPassengers
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs',
      error: error.message
    });
  }
});

// Update the announcement endpoint in your ridekada-admin/server.js

// POST announcement - UPDATED VERSION
app.post('/api/admin/announcement', requireAuth, async (req, res) => {
  try {
    const { message, title } = req.body;
    const adminId = req.session.adminId;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Announcement message is required'
      });
    }
    
    // Insert announcement into database
    const [result] = await pool.query(
      'INSERT INTO announcements (AdminID, Title, Message, IsActive) VALUES (?, ?, ?, 1)',
      [adminId, title || 'Announcement', message.trim()]
    );
    
    console.log('Announcement published:', { id: result.insertId, message });
    
    res.json({
      success: true,
      message: 'Announcement published successfully',
      announcementId: result.insertId
    });
  } catch (error) {
    console.error('Error posting announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post announcement',
      error: error.message
    });
  }
});

// GET all announcements (for admin dashboard)
app.get('/api/admin/announcements', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.AnnouncementID,
        a.Title,
        a.Message,
        a.CreatedAt,
        a.IsActive,
        ad.Username as AdminUsername
      FROM announcements a
      LEFT JOIN admin ad ON a.AdminID = ad.AdminID
      ORDER BY a.CreatedAt DESC
      LIMIT 50
    `);
    
    res.json({
      success: true,
      count: rows.length,
      announcements: rows
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error.message
    });
  }
});

// Toggle announcement active status
app.put('/api/admin/announcement/:id/toggle', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE announcements SET IsActive = NOT IsActive WHERE AnnouncementID = ?',
      [req.params.id]
    );
    
    res.json({
      success: true,
      message: 'Announcement status updated'
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement'
    });
  }
});

// Delete announcement
app.delete('/api/admin/announcement/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE AnnouncementID = ?', [req.params.id]);
    
    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement'
    });
  }
});

// Update dashboard stats to include real announcement count
// REPLACE the existing /api/admin/dashboard-stats endpoint with this:
app.get('/api/admin/dashboard-stats', requireAuth, async (req, res) => {
  try {
    const [activeDrivers] = await pool.query(
      "SELECT COUNT(*) as count FROM driver WHERE Status = 'Active'"
    );
    
    const [passengers] = await pool.query('SELECT COUNT(*) as count FROM user');
    
    const [earnings] = await pool.query(
      "SELECT COALESCE(SUM(Amount), 0) as total FROM payment WHERE Status = 'Completed'"
    );
    
    const [expenses] = await pool.query(
      "SELECT COALESCE(SUM(TotalFare), 0) as total FROM booking WHERE Status = 'Completed'"
    );
    
    const [availableRides] = await pool.query(
      "SELECT COUNT(*) as count FROM driver WHERE Status = 'Active'"
    );
    
    // Get real announcement count
    const [announcementCount] = await pool.query(
      "SELECT COUNT(*) as count FROM announcements WHERE IsActive = 1"
    );
    
    const totalUsers = activeDrivers[0].count + passengers[0].count;
    
    res.json({
      success: true,
      stats: {
        activeDrivers: activeDrivers[0].count,
        registeredPassengers: passengers[0].count,
        totalEarnings: parseFloat(earnings[0].total),
        announcements: announcementCount[0].count, // Real count now
        totalExpenses: parseFloat(expenses[0].total),
        availableRides: availableRides[0].count,
        totalUsers: totalUsers
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
});


// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'RideKada Admin Panel',
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ RideKada Admin Panel running on port ${PORT}`);
    console.log(`✓ Access at: http://localhost:${PORT}`);
    console.log(`✓ Default credentials: admin / admin123`);
  });
}

startServer();