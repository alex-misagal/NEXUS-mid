<?php
header('Content-Type: application/json');
include 'connect.php';

$driverId = intval($_GET['driverId'] ?? 0);

if ($driverId <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid driver ID"]);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT RideID, FromLocation as 'From', Destination, DateTime, 
               TotalSeats, AvailableSeats, (TotalSeats - AvailableSeats) as BookedSeats,
               Fare, Status, Notes
        FROM driver_rides
        WHERE DriverID = ? AND Status = 'Upcoming' AND DateTime > NOW()
        ORDER BY DateTime ASC
    ");
    
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $rides = [];
    while ($row = $result->fetch_assoc()) {
        $rides[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "rides" => $rides
    ]);
    
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

$conn->close();
?>s