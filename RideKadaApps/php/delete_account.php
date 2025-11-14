<?php
header('Content-Type: application/json');
include 'connect.php';

// Get input
$data = json_decode(file_get_contents('php://input'), true);
$userId = (int)($data['UserID'] ?? 0);

if ($userId <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid user ID"]);
    exit;
}

// Check if user exists
$stmt = $conn->prepare("SELECT 1 FROM user WHERE UserID = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    $stmt->close();
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
}
$stmt->close();

// DELETE USER (ONLY)
$stmt = $conn->prepare("DELETE FROM user WHERE UserID = ?");
$stmt->bind_param("i", $userId);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Account deleted permanently."]);
} else {
    echo json_encode(["success" => false, "message" => "Delete failed: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>