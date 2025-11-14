<?php
header('Content-Type: application/json');
include 'connect.php';

$data = json_decode(file_get_contents('php://input'), true);

$Fname       = trim($data['Fname'] ?? '');
$Lname      = trim($data['Lname'] ?? '');
$Email       = trim($data['Email'] ?? '');
$Password    = $data['Password'] ?? '';
$PhoneNumber = trim($data['PhoneNumber'] ?? '');

if (!$Fname || !$Lname || !$Email || !$Password || !$PhoneNumber) {
    echo json_encode(["success"=>false,"message"=>"Please fill in all fields."]);
    exit;
}

/* Check if email exists */
$stmt = $conn->prepare("SELECT UserID FROM user WHERE Email = ?");
$stmt->bind_param("s", $Email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    echo json_encode(["success"=>false,"message"=>"Email already registered."]);
    $stmt->close(); $conn->close(); exit;
}
$stmt->close();

/* Insert with PLAIN password */
$stmt = $conn->prepare(
    "INSERT INTO user (Fname, Lname, Email, Password, PhoneNumber) VALUES (?,?,?,?,?)"
);
$stmt->bind_param("sssss", $Fname, $Lname, $Email, $Password, $PhoneNumber);

if ($stmt->execute()) {
    $userId = $conn->insert_id;
    $user = [
        "UserID"      => $userId,
        "Fname"       => $Fname,
        "Lname"       => $Lname,
        "Email"       => $Email,
        "PhoneNumber" => $PhoneNumber
    ];
    echo json_encode([
        "success" => true,
        "message" => "User registered successfully.",
        "user"    => $user
    ]);
} else {
    echo json_encode(["success"=>false,"message"=>"Failed to register user."]);
}
$stmt->close();
$conn->close();
?>