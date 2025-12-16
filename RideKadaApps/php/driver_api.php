<?php
header('Content-Type: application/json');
include 'connect.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'getDashboardStats':
        getDashboardStats($conn);
        break;
    case 'publishRide':
        publishRide($conn);
        break;
    case 'getBookings':
        getBookings($conn);
        break;
    case 'handleBooking':
        handleBooking($conn);
        break;
    case 'getRides':
        getRides($conn);
        break;
    case 'cancelRide':
        cancelRide($conn);
        break;
    case 'getPassengers':
        getPassengers($conn);
        break;
    case 'getEarnings':
        getEarnings($conn);
        break;
    case 'ratePassenger':
        ratePassenger($conn);
        break;
    case 'getNotifications':
        getNotifications($conn);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

$conn->close();

// Get dashboard statistics
function getDashboardStats($conn) {
    $driverId = intval($_GET['driverId'] ?? 0);
    
    if ($driverId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid driver ID']);
        return;
    }
    
    // Upcoming rides
    $upcomingQuery = "SELECT COUNT(*) as count FROM driver_rides 
                      WHERE DriverID = ? AND Status = 'Upcoming' AND DateTime > NOW()";
    $stmt = $conn->prepare($upcomingQuery);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $upcomingRides = $stmt->get_result()->fetch_assoc()['count'];
    $stmt->close();
    
    // Completed rides
    $completedQuery = "SELECT COUNT(*) as count FROM driver_rides 
                       WHERE DriverID = ? AND Status = 'Completed'";
    $stmt = $conn->prepare($completedQuery);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $completedRides = $stmt->get_result()->fetch_assoc()['count'];
    $stmt->close();
    
    // Pending bookings
    $pendingQuery = "SELECT COUNT(*) as count FROM booking b
                     JOIN driver_rides dr ON b.RideID = dr.RideID
                     WHERE dr.DriverID = ? AND b.Status = 'Pending'";
    $stmt = $conn->prepare($pendingQuery);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $pendingBookings = $stmt->get_result()->fetch_assoc()['count'];
    $stmt->close();
    
    // Total earnings
    $earningsQuery = "SELECT COALESCE(SUM(p.Amount), 0) as total FROM payment p
                      JOIN booking b ON p.BookingID = b.BookingID
                      JOIN driver_rides dr ON b.RideID = dr.RideID
                      WHERE dr.DriverID = ? AND p.Status = 'Completed'";
    $stmt = $conn->prepare($earningsQuery);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $totalEarnings = floatval($stmt->get_result()->fetch_assoc()['total']);
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'upcomingRides' => $upcomingRides,
            'completedRides' => $completedRides,
            'pendingBookings' => $pendingBookings,
            'totalEarnings' => $totalEarnings
        ]
    ]);
}

// Publish a new ride
function publishRide($conn) {
    $driverId = intval($_POST['driverId'] ?? 0);
    $fromLocation = trim($_POST['fromLocation'] ?? 'Maryheights');
    $destination = trim($_POST['destination'] ?? '');
    $rideDate = trim($_POST['rideDate'] ?? '');
    $rideTime = trim($_POST['rideTime'] ?? '');
    $availableSeats = intval($_POST['availableSeats'] ?? 0);
    $fare = floatval($_POST['fare'] ?? 0);
    $notes = trim($_POST['notes'] ?? '');
    
    if ($driverId <= 0 || empty($destination) || empty($rideDate) || empty($rideTime) || $availableSeats <= 0 || $fare <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid input data']);
        return;
    }
    
    // Combine date and time
    $dateTime = $rideDate . ' ' . $rideTime . ':00';
    
    // Check if driver_rides table exists, if not create it
    $createTableQuery = "CREATE TABLE IF NOT EXISTS driver_rides (
        RideID INT PRIMARY KEY AUTO_INCREMENT,
        DriverID INT NOT NULL,
        FromLocation VARCHAR(255) NOT NULL,
        Destination VARCHAR(255) NOT NULL,
        DateTime DATETIME NOT NULL,
        TotalSeats INT NOT NULL,
        AvailableSeats INT NOT NULL,
        Fare DECIMAL(10,2) NOT NULL,
        Status ENUM('Upcoming', 'Completed', 'Cancelled') DEFAULT 'Upcoming',
        Notes TEXT,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (DriverID) REFERENCES driver(DriverID) ON DELETE CASCADE
    )";
    $conn->query($createTableQuery);
    
    // Insert ride
    $insertQuery = "INSERT INTO driver_rides (DriverID, FromLocation, Destination, DateTime, TotalSeats, AvailableSeats, Fare, Status, Notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'Upcoming', ?)";
    $stmt = $conn->prepare($insertQuery);
    $stmt->bind_param("isssiids", $driverId, $fromLocation, $destination, $dateTime, $availableSeats, $availableSeats, $fare, $notes);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Ride published successfully', 'rideId' => $stmt->insert_id]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to publish ride: ' . $stmt->error]);
    }
    $stmt->close();
}

// Get bookings for driver
function getBookings($conn) {
    $driverId = intval($_GET['driverId'] ?? 0);
    $filter = trim($_GET['filter'] ?? 'pending');
    
    if ($driverId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid driver ID']);
        return;
    }
    
    $statusMap = [
        'pending' => 'Pending',
        'accepted' => 'Confirmed',
        'declined' => 'Cancelled'
    ];
    
    $status = $statusMap[$filter] ?? 'Pending';
    
    $query = "SELECT 
                b.BookingID,
                b.RideID,
                b.Status,
                b.SeatCount,
                b.TotalFare,
                dr.Destination,
                dr.DateTime as RideDate,
                CONCAT(u.Fname, ' ', u.Lname) as PassengerName,
                u.PhoneNumber as PassengerPhone,
                u.Email as PassengerEmail
              FROM booking b
              JOIN driver_rides dr ON b.RideID = dr.RideID
              LEFT JOIN user u ON b.UserID = u.UserID
              WHERE dr.DriverID = ? AND b.Status = ?
              ORDER BY dr.DateTime DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("is", $driverId, $status);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        $bookings[] = $row;
    }
    
    echo json_encode(['success' => true, 'bookings' => $bookings]);
    $stmt->close();
}

// Handle booking (accept/decline)
function handleBooking($conn) {
    $bookingId = intval($_POST['bookingId'] ?? 0);
    $bookingAction = trim($_POST['bookingAction'] ?? '');
    
    if ($bookingId <= 0 || empty($bookingAction)) {
        echo json_encode(['success' => false, 'message' => 'Invalid input']);
        return;
    }
    
    $newStatus = $bookingAction === 'accept' ? 'Confirmed' : 'Cancelled';
    
    $updateQuery = "UPDATE booking SET Status = ? WHERE BookingID = ?";
    $stmt = $conn->prepare($updateQuery);
    $stmt->bind_param("si", $newStatus, $bookingId);
    
    if ($stmt->execute()) {
        // If accepted, update available seats
        if ($bookingAction === 'accept') {
            $getSeatsQuery = "SELECT RideID, SeatCount FROM booking WHERE BookingID = ?";
            $stmtSeats = $conn->prepare($getSeatsQuery);
            $stmtSeats->bind_param("i", $bookingId);
            $stmtSeats->execute();
            $result = $stmtSeats->get_result();
            
            if ($row = $result->fetch_assoc()) {
                $rideId = $row['RideID'];
                $seatCount = $row['SeatCount'];
                
                $updateSeatsQuery = "UPDATE driver_rides SET AvailableSeats = AvailableSeats - ? WHERE RideID = ?";
                $stmtUpdate = $conn->prepare($updateSeatsQuery);
                $stmtUpdate->bind_param("ii", $seatCount, $rideId);
                $stmtUpdate->execute();
                $stmtUpdate->close();
            }
            $stmtSeats->close();
        }
        
        echo json_encode(['success' => true, 'message' => ucfirst($bookingAction) . 'ed successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update booking']);
    }
    $stmt->close();
}

// Get rides for driver
function getRides($conn) {
    $driverId = intval($_GET['driverId'] ?? 0);
    $filter = trim($_GET['filter'] ?? 'upcoming');
    
    if ($driverId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid driver ID']);
        return;
    }
    
    $statusMap = [
        'upcoming' => 'Upcoming',
        'completed' => 'Completed',
        'cancelled' => 'Cancelled'
    ];
    
    $status = $statusMap[$filter] ?? 'Upcoming';
    
    $query = "SELECT 
                RideID,
                FromLocation,
                Destination,
                DateTime,
                TotalSeats,
                AvailableSeats,
                Fare,
                Status,
                Notes,
                CreatedAt
              FROM driver_rides
              WHERE DriverID = ? AND Status = ?
              ORDER BY DateTime DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("is", $driverId, $status);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $rides = [];
    while ($row = $result->fetch_assoc()) {
        $rides[] = $row;
    }
    
    echo json_encode(['success' => true, 'rides' => $rides]);
    $stmt->close();
}

// Cancel a ride
function cancelRide($conn) {
    $rideId = intval($_POST['rideId'] ?? 0);
    $reason = trim($_POST['reason'] ?? '');
    
    if ($rideId <= 0 || empty($reason)) {
        echo json_encode(['success' => false, 'message' => 'Invalid input']);
        return;
    }
    
    // Update ride status
    $updateQuery = "UPDATE driver_rides SET Status = 'Cancelled', Notes = CONCAT(COALESCE(Notes, ''), '\nCancellation Reason: ', ?) WHERE RideID = ?";
    $stmt = $conn->prepare($updateQuery);
    $stmt->bind_param("si", $reason, $rideId);
    
    if ($stmt->execute()) {
        // Cancel all related bookings
        $cancelBookingsQuery = "UPDATE booking SET Status = 'Cancelled' WHERE RideID = ?";
        $stmtCancel = $conn->prepare($cancelBookingsQuery);
        $stmtCancel->bind_param("i", $rideId);
        $stmtCancel->execute();
        $stmtCancel->close();
        
        echo json_encode(['success' => true, 'message' => 'Ride cancelled successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to cancel ride']);
    }
    $stmt->close();
}

// Get passengers who have booked with this driver
function getPassengers($conn) {
    $driverId = intval($_GET['driverId'] ?? 0);
    
    if ($driverId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid driver ID']);
        return;
    }
    
    $query = "SELECT 
                u.UserID,
                CONCAT(u.Fname, ' ', u.Lname) as PassengerName,
                u.PhoneNumber as PassengerPhone,
                u.Email as PassengerEmail,
                COUNT(DISTINCT b.BookingID) as TripCount,
                AVG(pr.Rating) as Rating
              FROM booking b
              JOIN driver_rides dr ON b.RideID = dr.RideID
              JOIN user u ON b.UserID = u.UserID
              LEFT JOIN passenger_ratings pr ON u.UserID = pr.PassengerID
              WHERE dr.DriverID = ? AND b.Status = 'Confirmed'
              GROUP BY u.UserID
              ORDER BY TripCount DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $passengers = [];
    while ($row = $result->fetch_assoc()) {
        $passengers[] = $row;
    }
    
    echo json_encode(['success' => true, 'passengers' => $passengers]);
    $stmt->close();
}

// Get earnings and transaction history
function getEarnings($conn) {
    $driverId = intval($_GET['driverId'] ?? 0);
    
    if ($driverId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid driver ID']);
        return;
    }
    
    // Total earnings
    $totalQuery = "SELECT COALESCE(SUM(p.Amount), 0) as total FROM payment p
                   JOIN booking b ON p.BookingID = b.BookingID
                   JOIN driver_rides dr ON b.RideID = dr.RideID
                   WHERE dr.DriverID = ? AND p.Status = 'Completed'";
    $stmt = $conn->prepare($totalQuery);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $total = floatval($stmt->get_result()->fetch_assoc()['total']);
    $stmt->close();
    
    // Monthly earnings
    $monthlyQuery = "SELECT COALESCE(SUM(p.Amount), 0) as total FROM payment p
                     JOIN booking b ON p.BookingID = b.BookingID
                     JOIN driver_rides dr ON b.RideID = dr.RideID
                     WHERE dr.DriverID = ? AND p.Status = 'Completed' 
                     AND MONTH(p.PaymentDate) = MONTH(CURRENT_DATE())
                     AND YEAR(p.PaymentDate) = YEAR(CURRENT_DATE())";
    $stmt = $conn->prepare($monthlyQuery);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $monthly = floatval($stmt->get_result()->fetch_assoc()['total']);
    $stmt->close();
    
    // Completed trips
    $tripsQuery = "SELECT COUNT(*) as count FROM driver_rides WHERE DriverID = ? AND Status = 'Completed'";
    $stmt = $conn->prepare($tripsQuery);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $completedTrips = intval($stmt->get_result()->fetch_assoc()['count']);
    $stmt->close();
    
    // Transaction history
    $transactionsQuery = "SELECT 
                            p.PaymentID,
                            p.Amount,
                            p.PaymentDate as Date,
                            CONCAT('Payment for ride to ', dr.Destination) as Description
                          FROM payment p
                          JOIN booking b ON p.BookingID = b.BookingID
                          JOIN driver_rides dr ON b.RideID = dr.RideID
                          WHERE dr.DriverID = ? AND p.Status = 'Completed'
                          ORDER BY p.PaymentDate DESC
                          LIMIT 20";
    $stmt = $conn->prepare($transactionsQuery);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $transactions = [];
    while ($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'earnings' => [
            'total' => $total,
            'monthly' => $monthly,
            'completedTrips' => $completedTrips
        ],
        'transactions' => $transactions
    ]);
}

// Rate passenger
function ratePassenger($conn) {
    $rideId = intval($_POST['rideId'] ?? 0);
    $rating = intval($_POST['rating'] ?? 0);
    $comment = trim($_POST['comment'] ?? '');
    
    if ($rideId <= 0 || $rating < 1 || $rating > 5) {
        echo json_encode(['success' => false, 'message' => 'Invalid input']);
        return;
    }
    
    // Create passenger_ratings table if it doesn't exist
    $createTableQuery = "CREATE TABLE IF NOT EXISTS passenger_ratings (
        RatingID INT PRIMARY KEY AUTO_INCREMENT,
        RideID INT NOT NULL,
        DriverID INT NOT NULL,
        PassengerID INT NOT NULL,
        Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
        Comment TEXT,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (RideID) REFERENCES driver_rides(RideID) ON DELETE CASCADE,
        FOREIGN KEY (DriverID) REFERENCES driver(DriverID) ON DELETE CASCADE,
        FOREIGN KEY (PassengerID) REFERENCES user(UserID) ON DELETE CASCADE
    )";
    $conn->query($createTableQuery);
    
    // Get passenger ID and driver ID from ride
    $getRideQuery = "SELECT dr.DriverID, b.UserID as PassengerID 
                     FROM driver_rides dr
                     JOIN booking b ON dr.RideID = b.RideID
                     WHERE dr.RideID = ?
                     LIMIT 1";
    $stmt = $conn->prepare($getRideQuery);
    $stmt->bind_param("i", $rideId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $driverId = $row['DriverID'];
        $passengerId = $row['PassengerID'];
        
        // Insert rating
        $insertQuery = "INSERT INTO passenger_ratings (RideID, DriverID, PassengerID, Rating, Comment)
                        VALUES (?, ?, ?, ?, ?)";
        $stmtInsert = $conn->prepare($insertQuery);
        $stmtInsert->bind_param("iiiis", $rideId, $driverId, $passengerId, $rating, $comment);
        
        if ($stmtInsert->execute()) {
            echo json_encode(['success' => true, 'message' => 'Rating submitted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to submit rating']);
        }
        $stmtInsert->close();
    } else {
        echo json_encode(['success' => false, 'message' => 'Ride not found']);
    }
    $stmt->close();
}

// Get notifications for driver
function getNotifications($conn) {
    $driverId = intval($_GET['driverId'] ?? 0);
    
    if ($driverId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid driver ID']);
        return;
    }
    
    // Create notifications table if it doesn't exist
    $createTableQuery = "CREATE TABLE IF NOT EXISTS driver_notifications (
        NotificationID INT PRIMARY KEY AUTO_INCREMENT,
        DriverID INT NOT NULL,
        Title VARCHAR(255) NOT NULL,
        Message TEXT NOT NULL,
        IsRead BOOLEAN DEFAULT FALSE,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (DriverID) REFERENCES driver(DriverID) ON DELETE CASCADE
    )";
    $conn->query($createTableQuery);
    
    // Get notifications
    $query = "SELECT NotificationID, Title, Message, IsRead, CreatedAt
              FROM driver_notifications
              WHERE DriverID = ?
              ORDER BY CreatedAt DESC
              LIMIT 20";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $notifications = [];
    $unreadCount = 0;
    
    while ($row = $result->fetch_assoc()) {
        $notifications[] = $row;
        if (!$row['IsRead']) {
            $unreadCount++;
        }
    }
    
    echo json_encode([
        'success' => true,
        'notifications' => $notifications,
        'unreadCount' => $unreadCount
    ]);
    $stmt->close();
}
?>