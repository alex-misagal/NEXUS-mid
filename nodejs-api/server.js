// RideKada Node.js API Server
// Read operations for drivers, users, and vehicles

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'ridekada_user',
  password: process.env.DB_PASSWORD || 'ridekada_pass',
  database: process.env.DB_NAME || 'nexus-mid',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
let pool;

// Initialize database connection
async function initializeDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log('✓ Connected to MySQL database');
    connection.release();
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    setTimeout(initializeDatabase, 5000); // Retry after 5 seconds
  }
}

// ===== READ ENDPOINTS =====

// 1. GET all users
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT UserID, Fname, Lname, Email, PhoneNumber, PCount FROM user'
    );
    res.json({
      success: true,
      count: rows.length,
      data: rows
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

// 2. GET user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT UserID, Fname, Lname, Email, PhoneNumber, PCount FROM user WHERE UserID = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// 3. GET all drivers with their vehicles
app.get('/api/drivers', async (req, res) => {
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
        v.PlateNumber,
        v.Model,
        v.Color,
        v.Capacity
      FROM driver d
      LEFT JOIN vehicle v ON d.VehicleID = v.VehicleID
      WHERE d.Status = 'Active'
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers',
      error: error.message
    });
  }
});

// 4. GET driver by ID
app.get('/api/drivers/:id', async (req, res) => {
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
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver',
      error: error.message
    });
  }
});

// 5. GET all vehicles
app.get('/api/vehicles', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT VehicleID, PlateNumber, Model, Color, Capacity FROM vehicle'
    );
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles',
      error: error.message
    });
  }
});

// 6. GET vehicle by ID
app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT VehicleID, PlateNumber, Model, Color, Capacity FROM vehicle WHERE VehicleID = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle',
      error: error.message
    });
  }
});

// 7. SEARCH drivers by destination
app.get('/api/drivers/search/:destination', async (req, res) => {
  try {
    const searchTerm = `%${req.params.destination}%`;
    const [rows] = await pool.query(`
      SELECT 
        d.DriverID,
        d.Fname,
        d.Lname,
        d.Email,
        d.PhoneNumber,
        d.Destination,
        v.PlateNumber,
        v.Model,
        v.Color,
        v.Capacity
      FROM driver d
      LEFT JOIN vehicle v ON d.VehicleID = v.VehicleID
      WHERE d.Status = 'Active' AND d.Destination LIKE ?
    `, [searchTerm]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error searching drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search drivers',
      error: error.message
    });
  }
});

// 8. GET all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        b.BookingID,
        b.Status,
        b.PaymentStatus,
        b.SeatCount,
        b.TotalFare,
        r.DateTime,
        r.Fare
      FROM booking b
      LEFT JOIN ride r ON b.RideID = r.RideID
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'RideKada Node.js API',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint - serve dashboard HTML
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// Start server
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ RideKada Node.js API running on port ${PORT}`);
    console.log(`✓ Access at: http://localhost:${PORT}`);
    console.log(`✓ Health check: http://localhost:${PORT}/health`);
  });
}

startServer();