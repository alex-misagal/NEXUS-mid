RideKada - Campus Carpooling Platform
Complete Setup and Installation Guide

TABLE OF CONTENTS

1. System Requirements
2. Environment Setup
3. Database Configuration
4. Application Setup
5. Admin Panel Setup
6. Running the Application
7. Default Credentials
8. Troubleshooting
9. Project Structure
10. Features Overview



1. SYSTEM REQUIREMENTS
Required Software:

WAMP Server (Windows)

Apache 2.4+
PHP 8.0+
MySQL 8.0+


Node.js 16.0+ (for Admin Panel)
npm (comes with Node.js)
Modern Web Browser (Chrome, Firefox, Edge, Safari)

Recommended:

Windows 10/11 or macOS 10.15+
4GB RAM minimum
500MB free disk space


2. ENVIRONMENT SETUP
Step 1: Install WAMP/XAMPP
For Windows (WAMP):

Download WAMP from: https://www.wampserver.com/
Run installer and follow prompts
Install to: C:\wamp64\ (default)
Launch WAMP - icon should be GREEN in system tray

For Cross-Platform (XAMPP):

Download XAMPP from: https://www.apachefriends.org/
Run installer
Install to: C:\xampp\ (Windows) or /Applications/XAMPP/ (macOS)
Launch XAMPP Control Panel
Start Apache and MySQL services

Step 2: Install Node.js

Download from: https://nodejs.org/
Run installer (choose LTS version)
Verify installation:

bash   node --version
   npm --version
```
   Should show version numbers (e.g., v18.17.0)

---

## 3. DATABASE CONFIGURATION

### Step 1: Access phpMyAdmin
- **WAMP**: Open browser → http://localhost/phpmyadmin
- **XAMPP**: Open browser → http://localhost/phpmyadmin

### Step 2: Create Database
1. Click "New" in left sidebar
2. Database name: `nexus-mid`
3. Collation: `utf8mb4_unicode_ci`
4. Click "Create"

### Step 3: Import Database Schema
1. Click on `nexus-mid` database in left sidebar
2. Click "Import" tab at top
3. Click "Choose File"
4. Navigate to: `RideKadaApps/sql/nexus-mid (8).sql`
5. Click "Go" at bottom
6. Wait for success message

### Step 4: Verify Tables
After import, you should see these tables:
- admin
- announcements
- booking
- driver
- driver_documents
- driver_notifications
- driver_reviews
- driver_rides
- payment
- published_rides
- review
- ride
- ride_bookings
- transactionhistory
- user
- vehicle

---

## 4. APPLICATION SETUP

### Step 1: Copy Project Files

**For WAMP:**
```
Copy entire RideKadaApps folder to:
C:\wamp64\www\RideKadaApps\
```

**For XAMPP:**
```
Copy entire RideKadaApps folder to:
C:\xampp\htdocs\RideKadaApps\
```

### Step 2: Create Upload Directories
Navigate to RideKadaApps folder and create:
```
RideKadaApps/
  └── uploads/
      └── driver_documents/
Windows Command:
bashcd C:\wamp64\www\RideKadaApps
mkdir uploads
mkdir uploads\driver_documents
macOS/Linux:
bashcd /Applications/XAMPP/htdocs/RideKadaApps
mkdir -p uploads/driver_documents
chmod -R 755 uploads
Step 3: Verify Database Connection

Open: RideKadaApps/php/connect.php
Verify settings:

php   $servername = "localhost";
   $username = "root";
   $password = "";  // Empty for WAMP/XAMPP default
   $database = "nexus-mid";

Save file (no changes needed for default setup)

Step 4: Test PHP Configuration
Create a test file: RideKadaApps/test.php
php<?php
require_once 'php/connect.php';
if ($conn) {
    echo "✓ Database connected successfully!";
} else {
    echo "✗ Database connection failed!";
}
?>
Visit: http://localhost/RideKadaApps/test.php
Should see: "✓ Database connected successfully!"

5. ADMIN PANEL SETUP
Step 1: Navigate to Admin Panel Directory
bashcd ridekada-admin
Step 2: Install Dependencies
bashnpm install
This will install:

express (web server)
mysql2 (database driver)
cors (cross-origin requests)
express-session (session management)

Step 3: Verify Admin Panel Configuration
Open: ridekada-admin/server.js
Check database config (around line 24):
javascriptconst dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nexus-mid',
  port: 3306
};
Step 4: Test Admin Panel (Optional)
bashnode server.js
```

Should see:
```
✓ Connected to MySQL database
✓ RideKada Admin Panel running on port 3001
✓ Access at: http://localhost:3001
✓ Default credentials: admin / admin123
Press Ctrl+C to stop (we'll start it properly in the next section)

6. RUNNING THE APPLICATION
Starting Services (Every Time)
Step 1: Start WAMP/XAMPP
WAMP:

Launch WAMP
Wait for icon to turn GREEN
If ORANGE, click → PHP → Version → Select latest

XAMPP:

Open XAMPP Control Panel
Click "Start" for Apache
Click "Start" for MySQL
Both should show "Running" in green

Step 2: Start Admin Panel
Open Command Prompt/Terminal:
bashcd path/to/ridekada-admin
node server.js
Windows Example:
bashcd C:\wamp64\www\RideKadaApps\..\ridekada-admin
node server.js
```

**Keep this window open** - this is your admin server

#### Step 3: Access Application

**Main Application (Users):**
```
http://localhost/RideKadaApps/index.html
```

**Admin Panel:**
```
http://localhost:3001
```

**phpMyAdmin (Database Management):**
```
http://localhost/phpmyadmin
```

---

## 7. DEFAULT CREDENTIALS

### Admin Panel
```
URL: http://localhost:3001
Username: admin
Password: admin123
```

### Test Users (Already in Database)

**Passengers:**
```
Email: johncruz@gmail.com
Password: pass123

Email: marias@gmail.com
Password: pass123
```

**Drivers (Active):**
```
Email: carlosm@gmail.com
Password: driver123

Email: jaysonr@gmail.com
Password: driver123
Drivers (Pending - Need Admin Approval):
Register new driver through driver registration page

8. TROUBLESHOOTING
Issue: "Database connection failed"
Solution:

Check WAMP/XAMPP is running
MySQL icon should be GREEN
Verify database name: nexus-mid
Check username/password in php/connect.php

Issue: "404 Not Found"
Solution:

Verify files in correct directory:

WAMP: C:\wamp64\www\RideKadaApps\
XAMPP: C:\xampp\htdocs\RideKadaApps\


Check URL: http://localhost/RideKadaApps/index.html
Apache must be running

Issue: "Admin Panel won't start"
Solution:

Check Node.js installed: node --version
Run npm install in ridekada-admin folder
Check port 3001 not in use:

bash   netstat -ano | findstr :3001

Kill conflicting process if needed

Issue: "Cannot upload documents"
Solution:

Check uploads/driver_documents/ folder exists
Set permissions (macOS/Linux):

bash   chmod -R 755 uploads
```
3. Windows: Right-click folder → Properties → Security → Full Control

### Issue: "PHP version error"
**Solution:**
1. WAMP: Click icon → PHP → Version → Select 8.x
2. Restart All Services
3. Verify: Create `info.php` with `<?php phpinfo(); ?>`

### Issue: "Admin panel can't connect to database"
**Solution:**
1. Verify MySQL running in XAMPP/WAMP
2. Check `server.js` line 24 has correct credentials
3. Test connection from PHP first (create test.php)

---

## 9. PROJECT STRUCTURE
```
RideKadaApps/
├── css/                          # Stylesheets
│   ├── driver_dashboard.css
│   ├── driver_search.css
│   ├── home.css
│   ├── payment.css
│   ├── profile.css
│   ├── sign_in.css
│   └── style.css
├── javascript/                   # Client-side scripts
│   ├── driver_dashboard.js
│   ├── driver_search.js
│   ├── home.js
│   ├── payment.js
│   ├── profile.js
│   └── script.js
├── media/                        # Images and assets
│   ├── logo.png
│   └── mtrd.jpg
├── php/                          # Backend PHP scripts
│   ├── connect.php              # Database connection
│   ├── login.php                # User authentication
│   ├── register.php             # User registration
│   ├── register_driver.php      # Driver registration
│   ├── create_booking.php       # Booking creation
│   ├── process_booking_payment.php
│   ├── get_passenger_bookings.php
│   ├── submit_driver_review.php
│   ├── driver_api.php           # Driver dashboard API
│   ├── driver_search.php        # Search rides
│   └── [other PHP files]
├── sql/                         # Database files
│   └── nexus-mid (8).sql
├── uploads/                     # Uploaded files
│   └── driver_documents/        # Driver documents
├── index.html                   # Landing page
├── sign_in.html                # Login page
├── home.html                    # User home
├── driver_dashboard.html        # Driver dashboard
├── driver_documents.html        # Document upload
├── driver_registration.html     # Driver signup
├── my_bookings.html            # User bookings
├── Payment.html                # Payment page
└── profile.html                # User profile

ridekada-admin/
├── public/
│   ├── css/
│   │   └── admin.css           # Admin panel styles
│   ├── js/
│   │   ├── dashboard.js        # Dashboard logic
│   │   └── login.js            # Login logic
│   ├── assets/
│   │   └── logo.png
│   ├── dashboard.html          # Main admin interface
│   └── login.html              # Admin login
├── server.js                   # Node.js backend
└── package.json                # Node dependencies

10. FEATURES OVERVIEW
For Passengers:
✓ Browse available rides
✓ Search by destination and date
✓ Book rides
✓ Pay via GCash/PayMaya
✓ View booking history
✓ Rate completed rides
✓ View announcements
For Drivers:
✓ Register and get verified
✓ Upload documents (license, registration)
✓ Publish rides
✓ Accept/decline booking requests
✓ View earnings
✓ Manage ride status
✓ Mark rides as completed
✓ View notifications
For Admins:
✓ Dashboard with statistics
✓ Manage users (drivers & passengers)
✓ Approve/decline new drivers
✓ View transaction history
✓ Monitor payments and rides
✓ Post announcements
✓ View reports

QUICK START CHECKLIST
□ WAMP/XAMPP installed and running
□ Node.js installed
□ Database created (nexus-mid)
□ SQL file imported successfully
□ Files copied to www/htdocs folder
□ uploads/driver_documents folder created
□ Admin panel dependencies installed (npm install)
□ Admin panel running (node server.js)
□ Can access main app (http://localhost/RideKadaApps/index.html)
□ Can access admin panel (http://localhost:3001)

SUPPORT AND CONTACT
Team NEXUS - SLU IT/CS 311
For issues or questions:

Check Troubleshooting section above
Verify all services are running
Check browser console for JavaScript errors (F12)
Check PHP error logs in WAMP/XAMPP