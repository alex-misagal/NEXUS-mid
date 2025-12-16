<?php
// RideKadaApps/php/get_passenger_bookings.php
// Get all bookings for a passenger with their status

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
    // Get all bookings for this passenger
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
                v.Model as VehicleModel,
                v.Color as VehicleColor,
                v.PlateNumber
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
        
        // Determine if payment is allowed
        $canPay = ($row['BookingStatus'] === 'Confirmed' && $row['PaymentStatus'] === 'Unpaid');
        
        $bookings[] = [
            'bookingId' => $row['BookingID'],
            'publishedRideId' => $row['PublishedRideID'],
            'referenceNumber' => 'RKB' . str_pad($row['BookingID'], 8, '0', STR_PAD_LEFT),
            'status' => $row['BookingStatus'],
            'paymentStatus' => $row['PaymentStatus'],
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
                'vehicle' => $row['VehicleColor'] . ' ' . $row['VehicleModel'],
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