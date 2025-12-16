<?php
// RideKadaApps/php/complete_ride.php
// NEW FILE - Allow driver to mark ride as completed

header('Content-Type: application/json');
session_start();
require_once 'connect.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit;
}

$publishedRideId = intval($input['publishedRideId'] ?? 0);
$driverId = intval($input['driverId'] ?? 0);

if ($publishedRideId <= 0 || $driverId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid ride or driver ID']);
    exit;
}

try {
    if (!$conn || $conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    // Start transaction
    $conn->begin_transaction();

    // 1. Verify the ride belongs to this driver and is available/full
    $checkRideStmt = $conn->prepare("
        SELECT 
            PublishedRideID,
            DriverID,
            Status,
            RideDate,
            RideTime,
            Destination
        FROM published_rides
        WHERE PublishedRideID = ? AND DriverID = ?
    ");
    
    if (!$checkRideStmt) {
        throw new Exception("Failed to prepare ride check: " . $conn->error);
    }
    
    $checkRideStmt->bind_param("ii", $publishedRideId, $driverId);
    $checkRideStmt->execute();
    $rideResult = $checkRideStmt->get_result();
    
    if ($rideResult->num_rows === 0) {
        $checkRideStmt->close();
        throw new Exception("Ride not found or you don't have permission to complete it");
    }
    
    $ride = $rideResult->fetch_assoc();
    $checkRideStmt->close();
    
    // Check if ride is already completed or cancelled
    if ($ride['Status'] === 'Completed') {
        throw new Exception("This ride has already been marked as completed");
    }
    
    if ($ride['Status'] === 'Cancelled') {
        throw new Exception("Cannot complete a cancelled ride");
    }

    // 2. Update the published ride status to Completed
    $updateRideStmt = $conn->prepare("
        UPDATE published_rides 
        SET Status = 'Completed'
        WHERE PublishedRideID = ?
    ");
    
    if (!$updateRideStmt) {
        throw new Exception("Failed to prepare ride update: " . $conn->error);
    }
    
    $updateRideStmt->bind_param("i", $publishedRideId);
    
    if (!$updateRideStmt->execute()) {
        throw new Exception("Failed to complete ride: " . $updateRideStmt->error);
    }
    
    $updateRideStmt->close();

    // 3. Update all confirmed bookings for this ride to Completed
    $updateBookingsStmt = $conn->prepare("
        UPDATE ride_bookings 
        SET BookingStatus = 'Completed'
        WHERE PublishedRideID = ? 
        AND BookingStatus = 'Confirmed'
        AND PaymentStatus = 'Paid'
    ");
    
    if (!$updateBookingsStmt) {
        throw new Exception("Failed to prepare bookings update: " . $conn->error);
    }
    
    $updateBookingsStmt->bind_param("i", $publishedRideId);
    $updateBookingsStmt->execute();
    $completedBookings = $updateBookingsStmt->affected_rows;
    $updateBookingsStmt->close();

    // 4. Get list of passengers for notifications
    $passengersStmt = $conn->prepare("
        SELECT 
            u.UserID,
            CONCAT(u.Fname, ' ', u.Lname) as PassengerName,
            rb.SeatsBooked,
            rb.TotalFare
        FROM ride_bookings rb
        JOIN user u ON rb.UserID = u.UserID
        WHERE rb.PublishedRideID = ? 
        AND rb.BookingStatus = 'Completed'
    ");
    
    if ($passengersStmt) {
        $passengersStmt->bind_param("i", $publishedRideId);
        $passengersStmt->execute();
        $passengersResult = $passengersStmt->get_result();
        
        $passengers = [];
        while ($passenger = $passengersResult->fetch_assoc()) {
            $passengers[] = $passenger;
        }
        
        $passengersStmt->close();
    }

    // 5. Create notification for driver
    $driverNotificationTitle = "Ride Completed";
    $driverNotificationMessage = "Your ride to " . $ride['Destination'] . 
                                " has been marked as completed. " . 
                                $completedBookings . " passenger booking(s) completed.";
    
    $tableCheck = $conn->query("SHOW TABLES LIKE 'driver_notifications'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        $notifyStmt = $conn->prepare("
            INSERT INTO driver_notifications (DriverID, Title, Message, IsRead)
            VALUES (?, ?, ?, FALSE)
        ");
        
        if ($notifyStmt) {
            $notifyStmt->bind_param("iss", $driverId, $driverNotificationTitle, $driverNotificationMessage);
            $notifyStmt->execute();
            $notifyStmt->close();
        }
    }

    // Commit transaction
    $conn->commit();
    
    error_log("Ride completed successfully - RideID: $publishedRideId, Completed Bookings: $completedBookings");

    echo json_encode([
        'success' => true,
        'message' => 'Ride marked as completed successfully',
        'publishedRideId' => $publishedRideId,
        'completedBookings' => $completedBookings,
        'passengers' => $passengers ?? []
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($conn) && $conn->ping()) {
        $conn->rollback();
    }
    
    error_log("Complete ride error: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

if (isset($conn)) {
    $conn->close();
}
?>