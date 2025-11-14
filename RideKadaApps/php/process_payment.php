<?php
session_start();
require_once 'connect.php';

header('Content-Type: application/json');

// Enable error logging
error_reporting(E_ALL);
ini_set('display_errors', 0);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit;
}

// Validate required fields
$requiredFields = ['driverId', 'driverName', 'driverPhone', 'vehicle', 'from', 'to', 'date', 'passengers', 'fare', 'paymentMethod'];

foreach ($requiredFields as $field) {
    if (!isset($input[$field]) || (is_string($input[$field]) && trim($input[$field]) === '')) {
        echo json_encode(['success' => false, 'message' => "Missing or empty required field: $field"]);
        exit;
    }
}

// Get user ID from session (if not available, create a demo user ID)
$userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 1; // Default to 1 for testing

$driverId = intval($input['driverId']);
$driverName = trim($input['driverName']);
$driverPhone = trim($input['driverPhone']);
$driverEmail = isset($input['driverEmail']) ? trim($input['driverEmail']) : '';
$vehicle = trim($input['vehicle']);
$plateNumber = isset($input['plateNumber']) ? trim($input['plateNumber']) : '';
$fromLocation = trim($input['from']);
$toLocation = trim($input['to']);
$rideDate = trim($input['date']);
$passengers = intval($input['passengers']);
$fare = floatval($input['fare']);
$paymentMethod = trim($input['paymentMethod']);
$availableSeats = isset($input['availableSeats']) ? intval($input['availableSeats']) : 0;

// Validate data types
if ($driverId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid driver ID']);
    exit;
}

if ($passengers <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid number of passengers']);
    exit;
}

if ($fare <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid fare amount']);
    exit;
}

try {
    // Check connection
    if (!$conn || $conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    // Start transaction
    $conn->begin_transaction();

    // 1. Create booking record
    $bookingStmt = $conn->prepare("
        INSERT INTO bookings (user_id, driver_id, from_location, to_location, ride_date, passengers, fare, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', NOW())
    ");
    
    if (!$bookingStmt) {
        throw new Exception("Prepare statement failed: " . $conn->error);
    }
    
    $bookingStmt->bind_param("iisssid", $userId, $driverId, $fromLocation, $toLocation, $rideDate, $passengers, $fare);
    
    if (!$bookingStmt->execute()) {
        throw new Exception("Failed to create booking: " . $bookingStmt->error);
    }
    
    $bookingId = $conn->insert_id;
    $bookingStmt->close();

    // 2. Create payment record
    $paymentStmt = $conn->prepare("
        INSERT INTO payments (booking_id, user_id, amount, payment_method, payment_status, transaction_date)
        VALUES (?, ?, ?, ?, 'completed', NOW())
    ");
    
    if (!$paymentStmt) {
        throw new Exception("Prepare payment statement failed: " . $conn->error);
    }
    
    $paymentStmt->bind_param("iids", $bookingId, $userId, $fare, $paymentMethod);
    
    if (!$paymentStmt->execute()) {
        throw new Exception("Failed to create payment record: " . $paymentStmt->error);
    }
    
    $paymentStmt->close();

    // 3. Update driver available seats (if seat info is provided and table exists)
    if ($availableSeats > 0) {
        $newAvailableSeats = max(0, $availableSeats - $passengers);
        
        // Check if rides table exists
        $checkTable = $conn->query("SHOW TABLES LIKE 'rides'");
        if ($checkTable && $checkTable->num_rows > 0) {
            $updateSeatsStmt = $conn->prepare("
                UPDATE rides SET available_seats = ? 
                WHERE driver_id = ? AND ride_date = ? AND from_location = ? AND to_location = ?
            ");
            
            if ($updateSeatsStmt) {
                $updateSeatsStmt->bind_param("iisss", $newAvailableSeats, $driverId, $rideDate, $fromLocation, $toLocation);
                $updateSeatsStmt->execute();
                $updateSeatsStmt->close();
            }
        }
    }

    // Commit transaction
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Payment successful! Your booking has been confirmed.',
        'bookingId' => $bookingId,
        'referenceNumber' => 'RK' . str_pad($bookingId, 8, '0', STR_PAD_LEFT)
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($conn) && $conn->ping()) {
        $conn->rollback();
    }
    
    // Log error (in production, log to file instead)
    error_log("Payment processing error: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Payment processing failed: ' . $e->getMessage()
    ]);
}

if (isset($conn)) {
    $conn->close();
}
?>