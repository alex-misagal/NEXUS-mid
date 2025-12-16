<?php
// RideKadaApps/php/process_booking_payment.php
// FIXED VERSION - Process payment for CONFIRMED bookings only

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

// Log the incoming request for debugging
error_log("Payment request received: " . json_encode($input));

// Required fields
$requiredFields = ['bookingId', 'totalFare', 'paymentMethod'];

foreach ($requiredFields as $field) {
    if (!isset($input[$field])) {
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit;
    }
}

// Extract data
$bookingId = intval($input['bookingId']);
$totalFare = floatval($input['totalFare']);
$paymentMethod = $input['paymentMethod'];
$userId = intval($input['userId'] ?? 0);

// Validate
if ($bookingId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid booking ID']);
    exit;
}

if ($totalFare <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid fare amount']);
    exit;
}

if (!in_array($paymentMethod, ['GCash', 'PayMaya', 'Cash'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid payment method']);
    exit;
}

try {
    if (!$conn || $conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    // Start transaction
    $conn->begin_transaction();

    // 1. Get booking details and verify status
    $checkBookingStmt = $conn->prepare("
        SELECT 
            rb.BookingID, 
            rb.UserID, 
            rb.PublishedRideID, 
            rb.BookingStatus, 
            rb.PaymentStatus, 
            rb.TotalFare, 
            rb.SeatsBooked,
            pr.Destination, 
            pr.RideDate, 
            pr.RideTime, 
            pr.DriverID
        FROM ride_bookings rb
        JOIN published_rides pr ON rb.PublishedRideID = pr.PublishedRideID
        WHERE rb.BookingID = ?
    ");
    
    if (!$checkBookingStmt) {
        throw new Exception("Failed to prepare booking check: " . $conn->error);
    }
    
    $checkBookingStmt->bind_param("i", $bookingId);
    $checkBookingStmt->execute();
    $bookingResult = $checkBookingStmt->get_result();
    
    if ($bookingResult->num_rows === 0) {
        $checkBookingStmt->close();
        throw new Exception("Booking not found");
    }
    
    $booking = $bookingResult->fetch_assoc();
    $checkBookingStmt->close();
    
    // Log booking status for debugging
    error_log("Booking Status: " . $booking['BookingStatus'] . ", Payment Status: " . $booking['PaymentStatus']);
    
    // CRITICAL CHECK: Verify booking is confirmed by driver
    if ($booking['BookingStatus'] !== 'Confirmed') {
        throw new Exception("This booking has not been confirmed by the driver yet. Current status: " . $booking['BookingStatus']);
    }
    
    // CRITICAL CHECK: Verify not already paid
    if ($booking['PaymentStatus'] === 'Paid') {
        throw new Exception("This booking has already been paid for");
    }
    
    // Verify fare amount matches
    if (abs($booking['TotalFare'] - $totalFare) > 0.01) {
        error_log("Fare mismatch - Expected: " . $booking['TotalFare'] . ", Received: " . $totalFare);
        throw new Exception("Fare amount mismatch. Please refresh and try again.");
    }
    
    // Verify user owns this booking (if userId provided)
    if ($userId > 0 && $booking['UserID'] != $userId) {
        throw new Exception("Unauthorized: This booking belongs to another user");
    }

    // 2. Create payment record FIRST
    $paymentStmt = $conn->prepare("
        INSERT INTO payment (BookingID, Amount, PaymentMethod, PaymentDate, Status)
        VALUES (?, ?, ?, NOW(), 'Completed')
    ");
    
    if (!$paymentStmt) {
        throw new Exception("Failed to prepare payment insert: " . $conn->error);
    }
    
    $paymentStmt->bind_param("ids", $bookingId, $totalFare, $paymentMethod);
    
    if (!$paymentStmt->execute()) {
        throw new Exception("Failed to create payment record: " . $paymentStmt->error);
    }
    
    $paymentId = $conn->insert_id;
    error_log("Payment record created with ID: " . $paymentId);
    $paymentStmt->close();

    // 3. Update booking payment status
    $updateBookingStmt = $conn->prepare("
        UPDATE ride_bookings 
        SET PaymentStatus = 'Paid',
            BookingStatus = 'Confirmed'
        WHERE BookingID = ? AND PaymentStatus = 'Unpaid'
    ");
    
    if (!$updateBookingStmt) {
        throw new Exception("Failed to prepare booking update: " . $conn->error);
    }
    
    $updateBookingStmt->bind_param("i", $bookingId);
    
    if (!$updateBookingStmt->execute()) {
        throw new Exception("Failed to update booking: " . $updateBookingStmt->error);
    }
    
    // Check if any rows were actually updated
    $rowsAffected = $updateBookingStmt->affected_rows;
    error_log("Booking update affected rows: " . $rowsAffected);
    
    if ($rowsAffected === 0) {
        throw new Exception("Booking payment status could not be updated. It may have already been paid.");
    }
    
    $updateBookingStmt->close();

    // 4. Log transaction history
    $transactionDescription = "Payment for ride to " . $booking['Destination'] . 
                            " on " . date('M d, Y', strtotime($booking['RideDate']));
    
    // Check if transactionhistory table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'transactionhistory'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        $transactionStmt = $conn->prepare("
            INSERT INTO transactionhistory (PaymentID, TransactionDate, TotalAmount, TransactionType)
            VALUES (?, NOW(), ?, 'Ride Payment')
        ");
        
        if ($transactionStmt) {
            $transactionStmt->bind_param("id", $paymentId, $totalFare);
            $transactionStmt->execute();
            $transactionStmt->close();
            error_log("Transaction history recorded");
        }
    }

    // 5. Notify driver of payment
    $notificationTitle = "Payment Received";
    $notificationMessage = "Payment of ₱" . number_format($totalFare, 2) . 
                          " received for ride to " . $booking['Destination'] . 
                          " on " . date('M d, Y', strtotime($booking['RideDate']));
    
    $tableCheck = $conn->query("SHOW TABLES LIKE 'driver_notifications'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        $notifyStmt = $conn->prepare("
            INSERT INTO driver_notifications (DriverID, Title, Message, IsRead)
            VALUES (?, ?, ?, FALSE)
        ");
        
        if ($notifyStmt) {
            $driverId = $booking['DriverID'];
            $notifyStmt->bind_param("iss", $driverId, $notificationTitle, $notificationMessage);
            $notifyStmt->execute();
            $notifyStmt->close();
            error_log("Driver notification sent");
        }
    }

    // Commit transaction
    $conn->commit();
    error_log("Payment transaction committed successfully");

    // Generate transaction reference
    $transactionRef = 'TXN' . str_pad($paymentId, 10, '0', STR_PAD_LEFT);

    echo json_encode([
        'success' => true,
        'message' => 'Payment processed successfully',
        'paymentId' => $paymentId,
        'transactionId' => $transactionRef,
        'bookingId' => $bookingId,
        'amount' => $totalFare
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($conn) && $conn->ping()) {
        $conn->rollback();
        error_log("Transaction rolled back due to error");
    }
    
    // Log error
    error_log("Payment processing error: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

if (isset($conn)) {
    $conn->close();
}
?>