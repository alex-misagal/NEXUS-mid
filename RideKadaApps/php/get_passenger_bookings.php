<?php
// RideKadaApps/php/get_passenger_bookings.php
// FIXED VERSION - Get all bookings with correct payment status

header('Content-Type: application/json');
session_start();
require_once 'connect.php';

$userId = intval($_GET['userId'] ?? 0);

// Try to get from session if not in URL
if ($userId <= 0 && isset($_SESSION['user']['UserID'])) {
    $userId = intval($_SESSION['user']['UserID']);
}

if ($userId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid user ID']);
    exit;
}

try {
    // Get all bookings for this passenger with detailed payment info
    $query = "SELECT 
                rb.BookingID,
                rb.PublishedRideID,
                rb.SeatsBooked,
                rb.TotalFare,
                rb.BookingStatus,
                rb.PaymentStatus,
                rb.BookingDate,
                pr.FromLocation,
                pr.Destination,
                pr.RideDate,
                pr.RideTime,
                pr.PricePerSeat,
                CONCAT(d.Fname, ' ', d.Lname) as DriverName,
                d.PhoneNumber as DriverPhone,
                d.Email as DriverEmail,
                COALESCE(v.Model, 'Vehicle') as VehicleModel,
                COALESCE(v.Color, '') as VehicleColor,
                COALESCE(v.PlateNumber, 'N/A') as PlateNumber,
                -- Check if payment actually exists
                (SELECT COUNT(*) FROM payment p 
                 WHERE p.BookingID = rb.BookingID 
                 AND p.Status = 'Completed') as PaymentExists
              FROM ride_bookings rb
              JOIN published_rides pr ON rb.PublishedRideID = pr.PublishedRideID
              JOIN driver d ON pr.DriverID = d.DriverID
              LEFT JOIN vehicle v ON d.VehicleID = v.VehicleID
              WHERE rb.UserID = ?
              ORDER BY rb.BookingDate DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        // Format date and time
        $rideDateTime = date('M d, Y g:i A', strtotime($row['RideDate'] . ' ' . $row['RideTime']));
        $bookingDate = date('M d, Y g:i A', strtotime($row['BookingDate']));
        
        // CRITICAL: Verify actual payment status
        // If PaymentExists is 0, force PaymentStatus to 'Unpaid'
        $actualPaymentStatus = ($row['PaymentExists'] > 0) ? 'Paid' : 'Unpaid';
        
        // Override the stored PaymentStatus if it doesn't match reality
        if ($actualPaymentStatus !== $row['PaymentStatus']) {
            error_log("Payment status mismatch for BookingID {$row['BookingID']}: Stored={$row['PaymentStatus']}, Actual={$actualPaymentStatus}");
            
            // Fix the database
            $fixStmt = $conn->prepare("UPDATE ride_bookings SET PaymentStatus = ? WHERE BookingID = ?");
            $fixStmt->bind_param("si", $actualPaymentStatus, $row['BookingID']);
            $fixStmt->execute();
            $fixStmt->close();
        }
        
        // Determine if payment is allowed
        // Can pay ONLY if: Confirmed by driver AND not yet paid
        $canPay = ($row['BookingStatus'] === 'Confirmed' && $actualPaymentStatus === 'Unpaid');
        
        $bookings[] = [
            'bookingId' => $row['BookingID'],
            'publishedRideId' => $row['PublishedRideID'],
            'referenceNumber' => 'RKB' . str_pad($row['BookingID'], 8, '0', STR_PAD_LEFT),
            'status' => $row['BookingStatus'],
            'paymentStatus' => $actualPaymentStatus, // Use verified status
            'canPay' => $canPay,
            'seatsBooked' => $row['SeatsBooked'],
            'totalFare' => $row['TotalFare'],
            'pricePerSeat' => $row['PricePerSeat'],
            'bookingDate' => $bookingDate,
            'rideDetails' => [
                'from' => $row['FromLocation'],
                'destination' => $row['Destination'],
                'rideDate' => $row['RideDate'],
                'rideTime' => $row['RideTime'],
                'rideDateTime' => $rideDateTime
            ],
            'driverDetails' => [
                'name' => $row['DriverName'],
                'phone' => $row['DriverPhone'],
                'email' => $row['DriverEmail'],
                'vehicle' => trim($row['VehicleColor'] . ' ' . $row['VehicleModel']),
                'plateNumber' => $row['PlateNumber']
            ]
        ];
    }
    
    // Count bookings by status
    $statusCounts = [
        'pending' => 0,
        'confirmed' => 0,
        'completed' => 0,
        'cancelled' => 0
    ];
    
    foreach ($bookings as $booking) {
        $status = strtolower($booking['status']);
        if (isset($statusCounts[$status])) {
            $statusCounts[$status]++;
        }
    }
    
    echo json_encode([
        'success' => true,
        'bookings' => $bookings,
        'counts' => $statusCounts,
        'total' => count($bookings)
    ]);
    
    $stmt->close();
    
} catch (Exception $e) {
    error_log("Get bookings error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to retrieve bookings: ' . $e->getMessage()
    ]);
}

$conn->close();
?>