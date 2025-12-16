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
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Database configuration
const dbConfig = {
  host: 'localhost',           // ← Changed from 'mysql' to 'localhost'
  user: 'root',                // ← Your WAMP MySQL username (usually 'root')
  password: '',                // ← Your WAMP MySQL password (usually empty)
  database: 'nexus-mid',       // ← Your database name
  port: 3306
};

let pool;

// Initialize database connection
async function initializeDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log('✓ Connected to MySQL database');
    
    // Create admin table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin (
        AdminID INT PRIMARY KEY AUTO_INCREMENT,
        Username VARCHAR(50) UNIQUE NOT NULL,
        Password VARCHAR(255) NOT NULL,
        Email VARCHAR(100),
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert default admin if table is empty
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

// Admin Login
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
    
    // Set session
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

// Admin Logout
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

// Check session
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
    // Active Drivers
    const [activeDrivers] = await pool.query(
      "SELECT COUNT(*) as count FROM driver WHERE Status = 'Active'"
    );
    
    // Registered Passengers (Users)
    const [passengers] = await pool.query(
      'SELECT COUNT(*) as count FROM user'
    );
    
    // Total Earnings (sum of completed payments)
    const [earnings] = await pool.query(
      "SELECT COALESCE(SUM(Amount), 0) as total FROM payment WHERE Status = 'Completed'"
    );
    
    // Total Expenses (placeholder - you can customize this)
    const [expenses] = await pool.query(
      "SELECT COALESCE(SUM(TotalFare), 0) as total FROM booking WHERE Status = 'Completed'"
    );
    
    // Available Rides (Active drivers)
    const [availableRides] = await pool.query(
      "SELECT COUNT(*) as count FROM driver WHERE Status = 'Active'"
    );
    
    // Total Users (drivers + passengers)
    const totalUsers = activeDrivers[0].count + passengers[0].count;
    
    res.json({
      success: true,
      stats: {
        activeDrivers: activeDrivers[0].count,
        registeredPassengers: passengers[0].count,
        totalEarnings: parseFloat(earnings[0].total),
        announcements: 1, // Static for now
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

// Monthly Earnings
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

// Get all users (drivers and passengers combined)
app.get('/api/admin/users', requireAuth, async (req, res) => {
  try {
    const { userType, status } = req.query;
    
    let query = `
      SELECT 
        u.UserID as id,
        u.Fname,
        u.Lname,
        u.Email,
        u.PhoneNumber,
        'Passenger' as UserType,
        'Active' as Status
      FROM user u
    `;
    
    if (userType === 'Driver') {
      query = `
        SELECT 
          d.DriverID as id,
          d.Fname,
          d.Lname,
          d.Email,
          d.PhoneNumber,
          'Driver' as UserType,
          d.Status
        FROM driver d
      `;
      
      if (status) {
        query += ` WHERE d.Status = '${status}'`;
      }
    } else if (userType === 'Passenger') {
      // Already set above
    } else {
      // Get both
      query = `
        SELECT 
          u.UserID as id,
          u.Fname,
          u.Lname,
          u.Email,
          u.PhoneNumber,
          'Passenger' as UserType,
          'Active' as Status
        FROM user u
        UNION ALL
        SELECT 
          d.DriverID as id,
          d.Fname,
          d.Lname,
          d.Email,
          d.PhoneNumber,
          'Driver' as UserType,
          d.Status
        FROM driver d
      `;
      
      if (status) {
        query = `
          SELECT * FROM (${query}) combined
          WHERE Status = '${status}'
        `;
      }
    }
    
    query += ' ORDER BY UserType, Fname';
    
    const [rows] = await pool.query(query);
    
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

// Get user details (Driver with vehicle)
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

// Get passenger details
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
      user: rows[0]
    });
  } catch (error) {
    console.error('Error fetching passenger details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch passenger details',
      error: error.message
    });
  }
});

// Update driver
app.put('/api/admin/users/driver/:id', requireAuth, async (req, res) => {
  try {
    const { Fname, Lname, Email, PhoneNumber, Password, PlateNumber, Model, Color, Capacity } = req.body;
    const driverId = req.params.id;
    
    // Update driver info
    let updateDriverQuery = `
      UPDATE driver 
      SET Fname = ?, Lname = ?, Email = ?, PhoneNumber = ?
    `;
    let driverParams = [Fname, Lname, Email, PhoneNumber];
    
    if (Password) {
      updateDriverQuery += ', Password = ?';
      driverParams.push(Password);
    }
    
    updateDriverQuery += ' WHERE DriverID = ?';
    driverParams.push(driverId);
    
    await pool.query(updateDriverQuery, driverParams);
    
    // Update vehicle if provided
    if (PlateNumber && Model && Color && Capacity) {
      const [driver] = await pool.query('SELECT VehicleID FROM driver WHERE DriverID = ?', [driverId]);
      
      if (driver[0].VehicleID) {
        await pool.query(`
          UPDATE vehicle 
          SET PlateNumber = ?, Model = ?, Color = ?, Capacity = ?
          WHERE VehicleID = ?
        `, [PlateNumber, Model, Color, Capacity, driver[0].VehicleID]);
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

// Update passenger
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

// Delete user
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
    // For demo, get recent drivers (you can add a 'Pending' status field later)
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

// Accept driver
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

// Decline driver
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

// ===== REPORTS & TRANSACTIONS =====

// Get user reports
app.get('/api/admin/reports/users', requireAuth, async (req, res) => {
  try {
    // This is a placeholder - you can create a reports table
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

// Get transactions
app.get('/api/admin/transactions', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.PaymentID,
        p.Amount,
        p.PaymentMethod,
        p.PaymentDate,
        b.BookingID,
        d.Fname as DriverFname,
        d.Lname as DriverLname,
        u.Fname as PassengerFname,
        u.Lname as PassengerLname
      FROM payment p
      LEFT JOIN booking b ON p.BookingID = b.BookingID
      LEFT JOIN ride r ON b.RideID = r.RideID
      LEFT JOIN driver d ON r.DriverID = d.DriverID
      LEFT JOIN user u ON r.UserID = u.UserID
      WHERE p.Status = 'Completed'
      ORDER BY p.PaymentDate DESC
      LIMIT 50
    `);
    
    res.json({
      success: true,
      count: rows.length,
      transactions: rows
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// ===== LOGS & ANNOUNCEMENTS =====

app.get('/api/admin/logs', requireAuth, async (req, res) => {
  try {
    // Get recent new drivers
    const [newDrivers] = await pool.query(`
      SELECT 
        DriverID as id,
        CONCAT(Fname, ' ', Lname) as name,
        Email,
        PhoneNumber,
        'New Driver' as type,
        NULL as vehicleDetails,
        NULL as licenseplate,
        NULL as vehicleColor
      FROM driver
      ORDER BY DriverID DESC
      LIMIT 5
    `);
    
    // Get recent new passengers
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

// Post announcement (placeholder)
app.post('/api/admin/announcement', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    
    // You can create an announcements table later
    console.log('Announcement:', message);
    
    res.json({
      success: true,
      message: 'Announcement published successfully'
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

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Dashboard endpoint
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Health check
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