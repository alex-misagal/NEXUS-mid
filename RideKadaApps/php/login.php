<?php
header('Content-Type: application/json');
include 'connect.php';

$data = json_decode(file_get_contents('php://input'), true);

$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(["success" => false, "message" => "Please provide email and password."]);
    exit;
}

$stmt = $conn->prepare("SELECT UserID, Fname, Lname, Email, PhoneNumber FROM user WHERE Email = ? AND Password = ?");
$stmt->bind_param("ss", $email, $password);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    echo json_encode([
        "success" => true,
        "user"    => $user
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid email or password."]);
}

$stmt->close();
$conn->close();
?>