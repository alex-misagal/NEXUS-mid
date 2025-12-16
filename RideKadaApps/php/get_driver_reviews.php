<?php
// RideKadaApps/php/get_driver_reviews.php
// Get all reviews for a specific driver

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

session_start();
require_once 'connect.php';

$driverId = intval($_GET['driverId'] ?? 0);

if ($driverId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid driver ID'
    ]);
    exit;
}

try {
    // Check if driver_reviews table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'driver_reviews'");
    if ($tableCheck->num_rows === 0) {
        echo json_encode([
            'success' => true,
            'reviews' => [],
            'stats' => [
                'averageRating' => 0,
                'totalReviews' => 0,
                'ratingBreakdown' => [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0]
            ]
        ]);
        exit;
    }

    // Get all reviews for this driver
    $stmt = $conn->prepare("
        SELECT 
            dr.ReviewID,
            dr.Rating,
            dr.Comment,
            dr.ReviewDate,
            CONCAT(u.Fname, ' ', u.Lname) as ReviewerName,
            pr.Destination,
            pr.RideDate
        FROM driver_reviews dr
        JOIN user u ON dr.UserID = u.UserID
        JOIN ride_bookings rb ON dr.BookingID = rb.BookingID
        JOIN published_rides pr ON rb.PublishedRideID = pr.PublishedRideID
        WHERE dr.DriverID = ?
        ORDER BY dr.ReviewDate DESC
    ");
    
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $reviews = [];
    while ($row = $result->fetch_assoc()) {
        $reviews[] = [
            'reviewId' => $row['ReviewID'],
            'rating' => $row['Rating'],
            'comment' => $row['Comment'],
            'reviewDate' => $row['ReviewDate'],
            'reviewerName' => $row['ReviewerName'],
            'destination' => $row['Destination'],
            'rideDate' => $row['RideDate']
        ];
    }
    $stmt->close();
    
    // Get rating statistics
    $statsStmt = $conn->prepare("
        SELECT 
            AVG(Rating) as avgRating,
            COUNT(*) as totalReviews,
            SUM(CASE WHEN Rating = 1 THEN 1 ELSE 0 END) as rating1,
            SUM(CASE WHEN Rating = 2 THEN 1 ELSE 0 END) as rating2,
            SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END) as rating3,
            SUM(CASE WHEN Rating = 4 THEN 1 ELSE 0 END) as rating4,
            SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END) as rating5
        FROM driver_reviews
        WHERE DriverID = ?
    ");
    
    $statsStmt->bind_param("i", $driverId);
    $statsStmt->execute();
    $stats = $statsStmt->get_result()->fetch_assoc();
    $statsStmt->close();
    
    echo json_encode([
        'success' => true,
        'reviews' => $reviews,
        'stats' => [
            'averageRating' => $stats['totalReviews'] > 0 ? round($stats['avgRating'], 1) : 0,
            'totalReviews' => intval($stats['totalReviews']),
            'ratingBreakdown' => [
                1 => intval($stats['rating1']),
                2 => intval($stats['rating2']),
                3 => intval($stats['rating3']),
                4 => intval($stats['rating4']),
                5 => intval($stats['rating5'])
            ]
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Get driver reviews error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching reviews'
    ]);
}

$conn->close();
?>