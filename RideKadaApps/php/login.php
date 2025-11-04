<?php
header('Content-Type: application/json');
include 'connect.php';

$data = json_decode(file_get_contents('php://input'), true);

$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$email || !$password) {
    echo json_encode([
        "success" => false,
        "message" => "Please provide email and password."
    ]);
    exit;
}

$stmt = $conn->prepare("SELECT UserID, Fname, Lname, Email, Password FROM user WHERE Email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$user = $result->fetch_assoc();

// Plain text password check here for now
if ($password === $user['Password']) {
    unset($user['Password']);
    echo json_encode([
        "success" => true,
        "user" => $user
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password."
    ]);
}

$stmt->close();
$conn->close();
