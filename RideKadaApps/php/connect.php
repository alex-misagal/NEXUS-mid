<?php
// Database connection setup for Docker environment
// Use environment variables if available, otherwise fall back to defaults
$servername = getenv('DB_HOST') ?: "mysql"; // Docker service name
$username = getenv('DB_USER') ?: "ridekada_user";
$password = getenv('DB_PASSWORD') ?: "ridekada_pass";
$database = getenv('DB_NAME') ?: "nexus-mid";

// Create connection with error handling
$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    // Log error for debugging
    error_log("Database connection failed: " . $conn->connect_error);
    
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit;
}

// Set charset to utf8mb4 for proper Unicode support
$conn->set_charset("utf8mb4");