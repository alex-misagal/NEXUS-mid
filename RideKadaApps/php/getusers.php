<?php
header('Content-Type: application/json');
include 'connect.php';

$sql = "SELECT UserID, Fname, Lname, Email, PhoneNumber FROM user";
$result = $conn->query($sql);

$users = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    echo json_encode([
        "success" => true,
        "users" => $users
    ]);
} else {
    echo json_encode([
        "success" => false,
        "users" => []
    ]);
}

$conn->close();