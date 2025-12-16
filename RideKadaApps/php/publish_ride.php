<?php
// RideKadaApps/php/publish_ride.php
header('Content-Type: application/json');
include 'connect.php';

$data = json_decode(file_get_contents('php://input'), true);

$driverId = intval($data['driverId'] ?? 0);
$destination = trim($data['destination'] ?? '');
$rideDate = trim($data['rideDate'] ?? '');
$rideTime = trim($data['rideTime'] ?? '');
$availableSeats = intval($data['availableSeats'] ?? 0);
$pricePerSeat = floatval($data['pricePerSeat'] ?? 0);
$notes = trim($data['notes'] ?? '');
$fromLocation = 'Maryheights'; // Fixed starting point

// Validate required fields
if ($driverId <= 0 || !$destination || !$rideDate || !$rideTime || $availableSeats <= 0 || $pricePerSeat <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Please fill in all required fields"
    ]);
    exit;
}

// Validate that ride date is not in the past
$today = date('Y-m-d');
if ($rideDate < $today) {
    echo json_encode([
        "success" => false,
        "message" => "Ride date cannot be in the past"
    ]);
    exit;
}

try {
    // Check if driver exists and is active
    $stmt = $conn->prepare("SELECT Status, VehicleID FROM driver WHERE DriverID = ?");
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Driver not found"
        ]);
        exit;
    }
    
    $driver = $result->fetch_assoc();
    if ($driver['Status'] !== 'Active') {
        echo json_encode([
            "success" => false,
            "message" => "Your account must be active to publish rides"
        ]);
        exit;
    }
    $stmt->close();
    
    // Get vehicle capacity to validate seats
    $stmt = $conn->prepare("SELECT Capacity FROM vehicle WHERE VehicleID = ?");
    $stmt->bind_param("i", $driver['VehicleID']);
    $stmt->execute();
    $result = $stmt->get_result();
    $vehicle = $result->fetch_assoc();
    $stmt->close();
    
    if ($availableSeats > $vehicle['Capacity']) {
        echo json_encode([
            "success" => false,
            "message" => "Available seats cannot exceed vehicle capacity ({$vehicle['Capacity']})"
        ]);
        exit;
    }
    
    // Insert published ride
    $stmt = $conn->prepare(
        "INSERT INTO published_rides (DriverID, FromLocation, Destination, RideDate, RideTime, AvailableSeats, PricePerSeat, Status, Notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Available', ?)"
    );
    $stmt->bind_param("issssids", $driverId, $fromLocation, $destination, $rideDate, $rideTime, $availableSeats, $pricePerSeat, $notes);
    
    if ($stmt->execute()) {
        $publishedRideId = $conn->insert_id;
        
        echo json_encode([
            "success" => true,
            "message" => "Ride published successfully!",
            "publishedRideId" => $publishedRideId
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Failed to publish ride: " . $stmt->error
        ]);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    error_log("Publish ride error: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}

$conn->close();
?>