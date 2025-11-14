<?php
header('Content-Type: application/json');
include 'connect.php';

// Enable error reporting (REMOVE IN PRODUCTION)
ini_set('display_errors', 0);
error_reporting(E_ALL);

$data = json_decode(file_get_contents('php://input'), true);

$userId      = (int)($data['UserID'] ?? 0);           // CAST TO INT
$Fname       = trim($data['Fname'] ?? '');
$Lname       = trim($data['Lname'] ?? '');
$Email       = trim($data['Email'] ?? '');
$PhoneNumber = trim($data['PhoneNumber'] ?? '');
$Address     = trim($data['Address'] ?? '');

if ($userId <= 0 || !$Fname || !$Lname || !$Email || !$PhoneNumber ) {
    echo json_encode(["success" => false, "message" => "Invalid data."]);
    exit;
}

/* Check email conflict */
$stmt = $conn->prepare("SELECT UserID FROM user WHERE Email = ? AND UserID != ?");
$stmt->bind_param("si", $Email, $userId);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Email already in use."]);
    $stmt->close(); $conn->close(); exit;
}
$stmt->close();

/* Update */
$stmt = $conn->prepare(
    "UPDATE user SET Fname = ?, Lname = ?, Email = ?, PhoneNumber = ?, Address = ? WHERE UserID = ?"
);
$stmt->bind_param("sssssi", $Fname, $Lname, $Email, $PhoneNumber, $Address, $userId);

if ($stmt->execute()) {
    $updatedUser = [
        "UserID"      => $userId,
        "Fname"       => $Fname,
        "Lname"       => $Lname,
        "Email"       => $Email,
        "PhoneNumber" => $PhoneNumber,
        "Address"     => $Address
    ];
    echo json_encode([
        "success" => true,
        "message" => "Profile updated!",
        "user"    => $updatedUser
    ]);
} else {
    // SHOW ACTUAL ERROR (FOR DEBUG ONLY)
    echo json_encode([
        "success" => false,
        "message" => "DB Error: " . $stmt->error
    ]);
}
$stmt->close();
$conn->close();
?>