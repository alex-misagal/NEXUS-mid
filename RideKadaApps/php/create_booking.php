<?php
// RideKadaApps/php/create_booking.php
// Creates a PENDING booking that requires driver acceptance before payment

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

session_start();
require_once 'connect.php';

// Enable error logging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get JSON input
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit;
}

// Required fields
$requiredFields = ['publishedRideId', 'passengers', 'totalFare'];

foreach ($requiredFields as $field) {
    if (!isset($input[$field])) {
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit;
    }
}

// Get user ID - try multiple sources
$userId = null;

if (isset($input['userId']) && $input['userId'] > 0) {
    $userId = intval($input['userId']);
} elseif (isset($_SESSION['user']['UserID'])) {
    $userId = intval($_SESSION['user']['UserID']);
} elseif (isset($_SESSION['user']) && is_string($_SESSION['user'])) {
    $userData = json_decode($_SESSION['user'], true);
    if (isset($userData['UserID'])) {
        $userId = intval($userData['UserID']);
    }
}

// Extract data
$publishedRideId = intval($input['publishedRideId']);
$passengers = intval($input['passengers']);
$totalFare = floatval($input['totalFare']);

// Validate data
if ($publishedRideId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid ride ID']);
    exit;
}

if ($passengers <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid number of passengers']);
    exit;
}

if ($totalFare <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid fare amount']);
    exit;
}

if (!$userId || $userId <= 0) {
    echo json_encode([
        'success' => false, 
        'message' => 'User not logged in. Please login first.'
    ]);
    exit;
}

try {
    // Check connection
    if (!$conn || $conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    // Start transaction
    $conn->begin_transaction();

    // 1. Verify the published ride exists and has enough seats
    $checkRideStmt = $conn->prepare("
        SELECT pr.AvailableSeats, pr.Status, pr.PricePerSeat, pr.Destination, 
               pr.RideDate, pr.RideTime, pr.DriverID,
               d.Fname as DriverFname, d.Lname as DriverLname, 
               d.PhoneNumber as DriverPhone,
               COALESCE(v.Model, 'Vehicle') as Model, 
               COALESCE(v.Color, '') as Color, 
               COALESCE(v.PlateNumber, 'N/A') as PlateNumber
        FROM published_rides pr
        JOIN driver d ON pr.DriverID = d.DriverID
        LEFT JOIN vehicle v ON d.VehicleID = v.VehicleID
        WHERE pr.PublishedRideID = ?
    ");
    
    if (!$checkRideStmt) {
        throw new Exception("Failed to prepare ride check: " . $conn->error);
    }
    
    $checkRideStmt->bind_param("i", $publishedRideId);
    
    if (!$checkRideStmt->execute()) {
        throw new Exception("Failed to execute ride check: " . $checkRideStmt->error);
    }
    
    $rideResult = $checkRideStmt->get_result();
    
    if ($rideResult->num_rows === 0) {
        $checkRideStmt->close();
        throw new Exception("Ride not found or no longer available");
    }
    
    $rideData = $rideResult->fetch_assoc();
    $checkRideStmt->close();
    
    // Check ride status
    if (!in_array($rideData['Status'], ['Available', 'Full'])) {
        throw new Exception("Ride is " . $rideData['Status']);
    }
    
    // Check seat availability
    if ($rideData['AvailableSeats'] < $passengers) {
        throw new Exception("Not enough seats available. Only " . $rideData['AvailableSeats'] . " seat(s) left.");
    }

    // 2. Check if user already has a pending booking for this ride
    $checkExistingStmt = $conn->prepare("
        SELECT BookingID FROM ride_bookings 
        WHERE PublishedRideID = ? AND UserID = ? AND BookingStatus = 'Pending'
    ");
    
    if (!$checkExistingStmt) {
        throw new Exception("Failed to prepare existing booking check: " . $conn->error);
    }
    
    $checkExistingStmt->bind_param("ii", $publishedRideId, $userId);
    $checkExistingStmt->execute();
    $existingResult = $checkExistingStmt->get_result();
    
    if ($existingResult->num_rows > 0) {
        $checkExistingStmt->close();
        throw new Exception("You already have a pending booking for this ride");
    }
    $checkExistingStmt->close();

    // 3. Create PENDING booking
    $bookingStmt = $conn->prepare("
        INSERT INTO ride_bookings 
        (PublishedRideID, UserID, SeatsBooked, TotalFare, BookingStatus, PaymentStatus)
        VALUES (?, ?, ?, ?, 'Pending', 'Unpaid')
    ");
    
    if (!$bookingStmt) {
        throw new Exception("Failed to prepare booking insert: " . $conn->error);
    }
    
    $bookingStmt->bind_param("iiid", $publishedRideId, $userId, $passengers, $totalFare);
    
    if (!$bookingStmt->execute()) {
        throw new Exception("Failed to create booking: " . $bookingStmt->error);
    }
    
    $bookingId = $conn->insert_id;
    $bookingStmt->close();

    // 4. Reserve seats (reduce available seats)
    $newAvailableSeats = $rideData['AvailableSeats'] - $passengers;
    $newStatus = ($newAvailableSeats <= 0) ? 'Full' : 'Available';
    
    $updateSeatsStmt = $conn->prepare("
        UPDATE published_rides 
        SET AvailableSeats = ?, Status = ?
        WHERE PublishedRideID = ?
    ");
    
    if (!$updateSeatsStmt) {
        throw new Exception("Failed to prepare seats update: " . $conn->error);
    }
    
    $updateSeatsStmt->bind_param("isi", $newAvailableSeats, $newStatus, $publishedRideId);
    
    if (!$updateSeatsStmt->execute()) {
        throw new Exception("Failed to update seats: " . $updateSeatsStmt->error);
    }
    
    $updateSeatsStmt->close();

    // 5. Create notification for driver
    $notificationTitle = "New Booking Request";
    $notificationMessage = "You have a new booking request for your ride to " . $rideData['Destination'] . 
                          " on " . date('M d, Y', strtotime($rideData['RideDate'])) . 
                          ". " . $passengers . " seat(s) requested.";
    
    // Check if driver_notifications table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'driver_notifications'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        $notifyStmt = $conn->prepare("
            INSERT INTO driver_notifications (DriverID, Title, Message, IsRead)
            VALUES (?, ?, ?, FALSE)
        ");
        
        if ($notifyStmt) {
            $driverId = $rideData['DriverID'];
            $notifyStmt->bind_param("iss", $driverId, $notificationTitle, $notificationMessage);
            $notifyStmt->execute();
            $notifyStmt->close();
        }
    }

    // Commit transaction
    $conn->commit();

    // Generate reference number
    $referenceNumber = 'RKB' . str_pad($bookingId, 8, '0', STR_PAD_LEFT);

    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Booking request submitted! Waiting for driver confirmation.',
        'bookingId' => $bookingId,
        'referenceNumber' => $referenceNumber,
        'status' => 'Pending',
        'rideDetails' => [
            'destination' => $rideData['Destination'],
            'rideDate' => $rideData['RideDate'],
            'rideTime' => $rideData['RideTime'],
            'driverName' => $rideData['DriverFname'] . ' ' . $rideData['DriverLname'],
            'vehicle' => trim($rideData['Color'] . ' ' . $rideData['Model']),
            'plateNumber' => $rideData['PlateNumber']
        ]
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($conn) && $conn->ping()) {
        $conn->rollback();
    }
    
    // Log error
    error_log("Booking creation error: " . $e->getMessage());
    
    // Return error response
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

if (isset($conn)) {
    $conn->close();
}
?>