<?php
header('Content-Type: application/json');
include 'connect.php';

// Read input JSON
$data = json_decode(file_get_contents('php://input'), true);

$Fname = trim($data['Fname'] ?? '');
$Lname = trim($data['Lname'] ?? '');
$Email = trim($data['Email'] ?? '');
$Password = $data['Password'] ?? '';
$PhoneNumber = trim($data['PhoneNumber'] ?? '');

if (!$Fname || !$Lname || !$Email || !$Password || !$PhoneNumber) {
    echo json_encode([
        "success" => false,
        "message" => "Please fill in all fields."
    ]);
    exit;
}

// Check if email already exists
$stmt = $conn->prepare("SELECT UserID FROM user WHERE Email = ?");
$stmt->bind_param("s", $Email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "Email already registered."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

// Hash password securely
$hashedPassword = password_hash($Password, PASSWORD_DEFAULT);

// Insert new user
$stmt = $conn->prepare("INSERT INTO user (Fname, Lname, Email, Password, PhoneNumber) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $Fname, $Lname, $Email, $hashedPassword, $PhoneNumber);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "User registered successfully."
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to register user."
    ]);
}

$stmt->close();
$conn->close();
