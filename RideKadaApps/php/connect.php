<?php
// Database connection setup
$servername = "localhost";
$username = "root";
$password = "";
$database = "nexus-mid"; // change if your database name differs

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit;
}