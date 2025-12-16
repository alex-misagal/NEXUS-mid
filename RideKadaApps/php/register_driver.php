<?php
header('Content-Type: application/json');
include 'connect.php';

$data = json_decode(file_get_contents('php://input'), true);

$Fname = $data['Fname'] ?? '';
$Lname = $data['Lname'] ?? '';
$Email = $data['Email'] ?? '';
$Password = $data['Password'] ?? '';
$PhoneNumber = $data['PhoneNumber'] ?? '';
$Destination = $data['Destination'] ?? '';
$PlateNumber = $data['PlateNumber'] ?? '';
$Model = $data['Model'] ?? '';
$Color = $data['Color'] ?? '';
$Capacity = $data['Capacity'] ?? 0;

// Validate
if (!$Fname || !$Email || !$Password || !$PhoneNumber) {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit;
}

// Insert vehicle
$stmt = $conn->prepare("INSERT INTO vehicle (PlateNumber, Model, Color, Capacity) VALUES (?, ?, ?, ?)");
$stmt->bind_param("sssi", $PlateNumber, $Model, $Color, $Capacity);
$stmt->execute();
$vehicleId = $conn->insert_id;
$stmt->close();

// Insert driver
$stmt = $conn->prepare("INSERT INTO driver (PhoneNumber, Fname, Lname, Email, Password, Status, Destination, VehicleID) VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)");
$stmt->bind_param("ssssssi", $PhoneNumber, $Fname, $Lname, $Email, $Password, $Destination, $vehicleId);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Registration successful!"]);
} else {
    echo json_encode(["success" => false, "message" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>