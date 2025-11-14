<?php
session_start();
require_once 'connect.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$requiredFields = ['driverId', 'driverName', 'driverPhone', 'driverEmail', 'vehicle', 'plateNumber', 'from', 'to', 'date', 'passengers', 'fare', 'paymentMethod'];

foreach ($requiredFields as $field) {
    if (!isset($input[$field]) || empty($input[$field])) {
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit;
    }
}

// Get user ID from session
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$userId = $_SESSION['user_id'];
$driverId = $input['driverId'];
$driverName = $input['driverName'];
$driverPhone = $input['driverPhone'];
$driverEmail = $input['driverEmail'];
$vehicle = $input['vehicle'];
$plateNumber = $input['plateNumber'];
$fromLocation = $input['from'];
$toLocation = $input['to'];
$rideDate = $input['date'];
$passengers = intval($input['passengers']);
$fare = floatval($input['fare']);
$paymentMethod = $input['paymentMethod'];
$availableSeats = isset($input['availableSeats']) ? intval($input['availableSeats']) : 0;

try {
    // Start transaction
    $conn->begin_transaction();

    // 1. Create booking record
    $bookingStmt = $conn->prepare("
        INSERT INTO bookings (user_id, driver_id, from_location, to_location, ride_date, passengers, fare, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', NOW())
    ");
    $bookingStmt->bind_param("iisssid", $userId, $driverId, $fromLocation, $toLocation, $rideDate, $passengers, $fare);
    
    if (!$bookingStmt->execute()) {
        throw new Exception("Failed to create booking");
    }
    
    $bookingId = $conn->insert_id;
    $bookingStmt->close();

    // 2. Create payment record
    $paymentStmt = $conn->prepare("
        INSERT INTO payments (booking_id, user_id, amount, payment_method, payment_status, transaction_date)
        VALUES (?, ?, ?, ?, 'completed', NOW())
    ");
    $paymentStmt->bind_param("iids", $bookingId, $userId, $fare, $paymentMethod);
    
    if (!$paymentStmt->execute()) {
        throw new Exception("Failed to create payment record");
    }
    
    $paymentStmt->close();

    // 3. Update driver available seats (if seat info is provided)
    if ($availableSeats > 0) {
        $newAvailableSeats = $availableSeats - $passengers;
        
        $updateSeatsStmt = $conn->prepare("
            UPDATE rides SET available_seats = ? 
            WHERE driver_id = ? AND ride_date = ? AND from_location = ? AND to_location = ?
        ");
        $updateSeatsStmt->bind_param("iisss", $newAvailableSeats, $driverId, $rideDate, $fromLocation, $toLocation);
        $updateSeatsStmt->execute();
        $updateSeatsStmt->close();
    }

    // 4. Send confirmation notification (placeholder - implement email/SMS service)
    // sendConfirmationEmail($driverEmail, $bookingId, $rideDate, $fromLocation, $toLocation);
    // sendConfirmationSMS($driverPhone, $bookingId);

    // Commit transaction
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Payment successful! Your booking has been confirmed.',
        'bookingId' => $bookingId
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    
    echo json_encode([
        'success' => false,
        'message' => 'Payment processing failed: ' . $e->getMessage()
    ]);
}

$conn->close();
?>