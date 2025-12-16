<?php
// RideKadaApps/php/get_available_rides.php
header('Content-Type: application/json');
include 'connect.php';

$destination = trim($_GET['destination'] ?? '');
$rideDate = trim($_GET['date'] ?? '');
$passengers = intval($_GET['passengers'] ?? 1);

try {
    // Build query
    $query = "SELECT 
                pr.PublishedRideID,
                pr.FromLocation,
                pr.Destination,
                pr.RideDate,
                pr.RideTime,
                pr.AvailableSeats,
                pr.PricePerSeat,
                pr.Notes,
                pr.Status,
                d.DriverID,
                d.Fname AS DriverFname,
                d.Lname AS DriverLname,
                d.PhoneNumber AS DriverPhone,
                d.Email AS DriverEmail,
                v.Model AS VehicleModel,
                v.Color AS VehicleColor,
                v.PlateNumber,
                v.Capacity
              FROM published_rides pr
              JOIN driver d ON pr.DriverID = d.DriverID
              JOIN vehicle v ON d.VehicleID = v.VehicleID
              WHERE pr.Status = 'Available' 
              AND d.Status = 'Active'
              AND pr.AvailableSeats >= ?";
    
    $params = [$passengers];
    $types = "i";
    
    // Filter by destination if provided
    if ($destination) {
        $query .= " AND pr.Destination LIKE ?";
        $params[] = "%$destination%";
        $types .= "s";
    }
    
    // Filter by date if provided
    if ($rideDate) {
        $query .= " AND pr.RideDate = ?";
        $params[] = $rideDate;
        $types .= "s";
    } else {
        // Only show future rides
        $query .= " AND pr.RideDate >= CURDATE()";
    }
    
    $query .= " ORDER BY pr.RideDate ASC, pr.RideTime ASC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $rides = [];
    while ($row = $result->fetch_assoc()) {
        // Calculate total fare for requested passengers
        $row['TotalFare'] = $row['PricePerSeat'] * $passengers;
        $rides[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "count" => count($rides),
        "rides" => $rides
    ]);
    
    $stmt->close();
    
} catch (Exception $e) {
    error_log("Get rides error: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch rides: " . $e->getMessage()
    ]);
}

$conn->close();
?>