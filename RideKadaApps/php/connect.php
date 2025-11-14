<?php
// Database connection setup
$servername = "localhost";
$username = "root";
$password = "";
$database = "nexus-mid"; 

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit;
}