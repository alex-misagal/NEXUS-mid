<?php
// Database connection for WAMP (local development)
$servername = "localhost";  // Changed from "mysql" to "localhost"
$username = "root";         // WAMP default username
$password = "";             // WAMP default password (empty)
$database = "nexus-mid";    // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit;
}

// Set charset to utf8mb4 for proper Unicode support
$conn->set_charset("utf8mb4");
?>