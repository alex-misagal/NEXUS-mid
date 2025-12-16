<?php
// RideKadaApps/php/submit_driver_review.php
// Handles user reviews for drivers after completed rides

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

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

// Required fields
$requiredFields = ['bookingId', 'userId', 'driverId', 'rating'];

foreach ($requiredFields as $field) {
    if (!isset($input[$field])) {
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit;
    }
}

// Extract and validate data
$bookingId = intval($input['bookingId']);
$userId = intval($input['userId']);
$driverId = intval($input['driverId']);
$rating = intval($input['rating']);
$comment = isset($input['comment']) ? trim($input['comment']) : '';

// Validate rating (1-5 stars)
if ($rating < 1 || $rating > 5) {
    echo json_encode(['success' => false, 'message' => 'Rating must be between 1 and 5']);
    exit;
}

// Validate IDs
if ($bookingId <= 0 || $userId <= 0 || $driverId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid booking, user, or driver ID']);
    exit;
}

try {
    if (!$conn || $conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    // Check if driver_reviews table exists, create if not
    $tableCheck = $conn->query("SHOW TABLES LIKE 'driver_reviews'");
    if ($tableCheck->num_rows === 0) {
        $createTable = "CREATE TABLE IF NOT EXISTS `driver_reviews` (
            `ReviewID` int NOT NULL AUTO_INCREMENT,
            `BookingID` int NOT NULL,
            `UserID` int NOT NULL,
            `DriverID` int NOT NULL,
            `Rating` int NOT NULL,
            `Comment` text,
            `ReviewDate` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`ReviewID`),
            UNIQUE KEY `unique_booking_review` (`BookingID`),
            KEY `idx_driver` (`DriverID`),
            KEY `idx_user` (`UserID`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        if (!$conn->query($createTable)) {
            throw new Exception("Failed to create reviews table: " . $conn->error);
        }
    }

    // Start transaction
    $conn->begin_transaction();

    // 1. Verify the booking exists, belongs to the user, and is completed
    $checkBookingStmt = $conn->prepare("
        SELECT rb.BookingID, rb.UserID, rb.BookingStatus, pr.DriverID
        FROM ride_bookings rb
        JOIN published_rides pr ON rb.PublishedRideID = pr.PublishedRideID
        WHERE rb.BookingID = ? AND rb.UserID = ?
    ");
    
    if (!$checkBookingStmt) {
        throw new Exception("Failed to prepare booking check: " . $conn->error);
    }
    
    $checkBookingStmt->bind_param("ii", $bookingId, $userId);
    $checkBookingStmt->execute();
    $bookingResult = $checkBookingStmt->get_result();
    
    if ($bookingResult->num_rows === 0) {
        $checkBookingStmt->close();
        throw new Exception("Booking not found or does not belong to this user");
    }
    
    $booking = $bookingResult->fetch_assoc();
    $checkBookingStmt->close();
    
    // Verify booking is completed
    if ($booking['BookingStatus'] !== 'Completed') {
        throw new Exception("You can only review completed rides. Current status: " . $booking['BookingStatus']);
    }
    
    // Verify driver ID matches
    if ($booking['DriverID'] != $driverId) {
        throw new Exception("Driver ID mismatch");
    }

    // 2. Check if review already exists for this booking
    $checkReviewStmt = $conn->prepare("
        SELECT ReviewID FROM driver_reviews WHERE BookingID = ?
    ");
    $checkReviewStmt->bind_param("i", $bookingId);
    $checkReviewStmt->execute();
    $existingReview = $checkReviewStmt->get_result();
    
    if ($existingReview->num_rows > 0) {
        $checkReviewStmt->close();
        throw new Exception("You have already reviewed this ride");
    }
    $checkReviewStmt->close();

    // 3. Insert the review
    $insertStmt = $conn->prepare("
        INSERT INTO driver_reviews (BookingID, UserID, DriverID, Rating, Comment)
        VALUES (?, ?, ?, ?, ?)
    ");
    
    if (!$insertStmt) {
        throw new Exception("Failed to prepare review insert: " . $conn->error);
    }
    
    $insertStmt->bind_param("iiiis", $bookingId, $userId, $driverId, $rating, $comment);
    
    if (!$insertStmt->execute()) {
        throw new Exception("Failed to submit review: " . $insertStmt->error);
    }
    
    $reviewId = $conn->insert_id;
    $insertStmt->close();

    // 4. Create notification for driver about the new review
    $tableCheck = $conn->query("SHOW TABLES LIKE 'driver_notifications'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        // Get user name for notification
        $userStmt = $conn->prepare("SELECT Fname, Lname FROM user WHERE UserID = ?");
        $userStmt->bind_param("i", $userId);
        $userStmt->execute();
        $userResult = $userStmt->get_result();
        $userData = $userResult->fetch_assoc();
        $userStmt->close();
        
        $userName = $userData ? $userData['Fname'] . ' ' . $userData['Lname'] : 'A passenger';
        
        $notificationTitle = "New Review Received";
        $notificationMessage = "$userName rated your ride $rating ⭐" . 
                              ($comment ? ": \"" . substr($comment, 0, 100) . (strlen($comment) > 100 ? "...\"" : "\"") : "");
        
        $notifyStmt = $conn->prepare("
            INSERT INTO driver_notifications (DriverID, Title, Message, IsRead)
            VALUES (?, ?, ?, FALSE)
        ");
        
        if ($notifyStmt) {
            $notifyStmt->bind_param("iss", $driverId, $notificationTitle, $notificationMessage);
            $notifyStmt->execute();
            $notifyStmt->close();
        }
    }

    // Commit transaction
    $conn->commit();

    // Calculate new average rating for driver
    $avgStmt = $conn->prepare("
        SELECT AVG(Rating) as avgRating, COUNT(*) as totalReviews 
        FROM driver_reviews WHERE DriverID = ?
    ");
    $avgStmt->bind_param("i", $driverId);
    $avgStmt->execute();
    $avgResult = $avgStmt->get_result()->fetch_assoc();
    $avgStmt->close();

    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your review!',
        'reviewId' => $reviewId,
        'driverStats' => [
            'averageRating' => round($avgResult['avgRating'], 1),
            'totalReviews' => $avgResult['totalReviews']
        ]
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($conn) && $conn->ping()) {
        $conn->rollback();
    }
    
    error_log("Submit review error: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

if (isset($conn)) {
    $conn->close();
}
?>