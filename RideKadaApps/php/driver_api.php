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
    
    // Upcoming rides (from published_rides)
    $upcomingQuery = "SELECT COUNT(*) as count FROM published_rides 
                      WHERE DriverID = ? AND Status = 'Available' 
                      AND CONCAT(RideDate, ' ', RideTime) > NOW()";
    $stmt = $conn->prepare($upcomingQuery);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $upcomingRides = $stmt->get_result()->fetch_assoc()['count'];
    $stmt->close();
    
    // Completed rides
    $completedQuery = "SELECT COUNT(*) as count FROM published_rides 
                       WHERE DriverID = ? AND Status = 'Completed'";
    $stmt = $conn->prepare($completedQuery);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $completedRides = $stmt->get_result()->fetch_assoc()['count'];
    $stmt->close();
    
    // Pending bookings (using ride_bookings)
    $pendingQuery = "SELECT COUNT(*) as count FROM ride_bookings rb
                     JOIN published_rides pr ON rb.PublishedRideID = pr.PublishedRideID
                     WHERE pr.DriverID = ? AND rb.BookingStatus = 'Pending'";
    $stmt = $conn->prepare($pendingQuery);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $pendingBookings = $stmt->get_result()->fetch_assoc()['count'];
    $stmt->close();
    
    // Total earnings (from ride_bookings with Confirmed/Completed status)
    $earningsQuery = "SELECT COALESCE(SUM(rb.TotalFare), 0) as total 
                      FROM ride_bookings rb
                      JOIN published_rides pr ON rb.PublishedRideID = pr.PublishedRideID
                      WHERE pr.DriverID = ? 
                      AND rb.BookingStatus IN ('Confirmed', 'Completed')
                      AND rb.PaymentStatus = 'Paid'";
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
    
    // Validate that ride date is not in the past
    $today = date('Y-m-d');
    if ($rideDate < $today) {
        echo json_encode(['success' => false, 'message' => 'Ride date cannot be in the past']);
        return;
    }
    
    // Insert into published_rides table
    $insertQuery = "INSERT INTO published_rides 
                    (DriverID, FromLocation, Destination, RideDate, RideTime, AvailableSeats, PricePerSeat, Status, Notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'Available', ?)";
    $stmt = $conn->prepare($insertQuery);
    $stmt->bind_param("isssiids", $driverId, $fromLocation, $destination, $rideDate, $rideTime, $availableSeats, $fare, $notes);
    
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
    
    // Query using ride_bookings and published_rides tables
    $query = "SELECT 
                rb.BookingID,
                rb.PublishedRideID as RideID,
                rb.BookingStatus as Status,
                rb.SeatsBooked as SeatCount,
                rb.TotalFare,
                rb.PaymentStatus,
                rb.BookingDate,
                pr.Destination,
                pr.RideDate,
                pr.RideTime,
                CONCAT(u.Fname, ' ', u.Lname) as PassengerName,
                u.PhoneNumber as PassengerPhone,
                u.Email as PassengerEmail
              FROM ride_bookings rb
              JOIN published_rides pr ON rb.PublishedRideID = pr.PublishedRideID
              LEFT JOIN user u ON rb.UserID = u.UserID
              WHERE pr.DriverID = ? AND rb.BookingStatus = ?
              ORDER BY rb.BookingDate DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("is", $driverId, $status);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        // Format date and time
        $row['RideDateTime'] = $row['RideDate'] . ' ' . $row['RideTime'];
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
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // Update booking status in ride_bookings table
        $updateQuery = "UPDATE ride_bookings SET BookingStatus = ? WHERE BookingID = ?";
        $stmt = $conn->prepare($updateQuery);
        $stmt->bind_param("si", $newStatus, $bookingId);
        $stmt->execute();
        $stmt->close();
        
        // If declining, restore the seats
        if ($bookingAction === 'decline') {
            $restoreSeatsQuery = "UPDATE published_rides pr
                                  JOIN ride_bookings rb ON pr.PublishedRideID = rb.PublishedRideID
                                  SET pr.AvailableSeats = pr.AvailableSeats + rb.SeatsBooked,
                                      pr.Status = 'Available'
                                  WHERE rb.BookingID = ?";
            $stmtRestore = $conn->prepare($restoreSeatsQuery);
            $stmtRestore->bind_param("i", $bookingId);
            $stmtRestore->execute();
            $stmtRestore->close();
        }
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => ucfirst($bookingAction) . 'ed successfully']);
        
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Failed to update booking: ' . $e->getMessage()]);
    }
}

// Get rides for driver
function getRides($conn) {
    $driverId = intval($_GET['driverId'] ?? 0);
    $filter = trim($_GET['filter'] ?? 'upcoming');
    
    if ($driverId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid driver ID']);
        return;
    }
    
    // Build query based on filter
    $query = "SELECT 
                pr.PublishedRideID as RideID,
                pr.FromLocation,
                pr.Destination,
                pr.RideDate,
                pr.RideTime,
                pr.AvailableSeats,
                pr.PricePerSeat as Fare,
                pr.Status,
                pr.Notes,
                pr.CreatedAt,
                (SELECT COUNT(*) FROM ride_bookings WHERE PublishedRideID = pr.PublishedRideID AND BookingStatus IN ('Confirmed', 'Pending')) as TotalBookings,
                (SELECT SUM(SeatsBooked) FROM ride_bookings WHERE PublishedRideID = pr.PublishedRideID AND BookingStatus = 'Confirmed') as BookedSeats
              FROM published_rides pr
              WHERE pr.DriverID = ?";
    
    // Add filter conditions
    if ($filter === 'upcoming') {
        $query .= " AND pr.Status = 'Available' AND CONCAT(pr.RideDate, ' ', pr.RideTime) > NOW()";
    } elseif ($filter === 'completed') {
        $query .= " AND pr.Status = 'Completed'";
    } elseif ($filter === 'cancelled') {
        $query .= " AND pr.Status = 'Cancelled'";
    }
    
    $query .= " ORDER BY pr.RideDate DESC, pr.RideTime DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $rides = [];
    while ($row = $result->fetch_assoc()) {
        // Combine date and time
        $row['DateTime'] = $row['RideDate'] . ' ' . $row['RideTime'];
        // Calculate total capacity
        $totalCapacity = intval($row['AvailableSeats']) + intval($row['BookedSeats'] ?? 0);
        $row['TotalSeats'] = $totalCapacity;
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
    
    $conn->begin_transaction();
    
    try {
        // Update ride status in published_rides
        $updateQuery = "UPDATE published_rides 
                       SET Status = 'Cancelled', 
                           Notes = CONCAT(COALESCE(Notes, ''), '\nCancellation Reason: ', ?) 
                       WHERE PublishedRideID = ?";
        $stmt = $conn->prepare($updateQuery);
        $stmt->bind_param("si", $reason, $rideId);
        $stmt->execute();
        $stmt->close();
        
        // Cancel all related bookings in ride_bookings
        $cancelBookingsQuery = "UPDATE ride_bookings 
                               SET BookingStatus = 'Cancelled' 
                               WHERE PublishedRideID = ? 
                               AND BookingStatus IN ('Pending', 'Confirmed')";
        $stmtCancel = $conn->prepare($cancelBookingsQuery);
        $stmtCancel->bind_param("i", $rideId);
        $stmtCancel->execute();
        $stmtCancel->close();
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Ride cancelled successfully']);
        
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Failed to cancel ride: ' . $e->getMessage()]);
    }
}

// Get passengers who have booked with this driver
function getPassengers($conn) {
    $driverId = intval($_GET['driverId'] ?? 0);
    
    if ($driverId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid driver ID']);
        return;
    }
    
    // Query to get unique passengers from ride_bookings
    $query = "SELECT 
                u.UserID,
                CONCAT(u.Fname, ' ', u.Lname) as PassengerName,
                u.PhoneNumber as PassengerPhone,
                u.Email as PassengerEmail,
                COUNT(DISTINCT rb.BookingID) as TripCount,
                SUM(rb.TotalFare) as TotalSpent,
                MAX(rb.BookingDate) as LastBooking
              FROM ride_bookings rb
              JOIN published_rides pr ON rb.PublishedRideID = pr.PublishedRideID
              JOIN user u ON rb.UserID = u.UserID
              WHERE pr.DriverID = ? 
              AND rb.BookingStatus IN ('Confirmed', 'Completed')
              GROUP BY u.UserID
              ORDER BY TripCount DESC, LastBooking DESC";
    
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
    
    // Total earnings from ride_bookings
    $totalQuery = "SELECT COALESCE(SUM(rb.TotalFare), 0) as total 
                   FROM ride_bookings rb
                   JOIN published_rides pr ON rb.PublishedRideID = pr.PublishedRideID
                   WHERE pr.DriverID = ? 
                   AND rb.BookingStatus IN ('Confirmed', 'Completed')
                   AND rb.PaymentStatus = 'Paid'";
    $stmt = $conn->prepare($totalQuery);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $total = floatval($stmt->get_result()->fetch_assoc()['total']);
    $stmt->close();
    
    // Monthly earnings
    $monthlyQuery = "SELECT COALESCE(SUM(rb.TotalFare), 0) as total 
                     FROM ride_bookings rb
                     JOIN published_rides pr ON rb.PublishedRideID = pr.PublishedRideID
                     WHERE pr.DriverID = ? 
                     AND rb.BookingStatus IN ('Confirmed', 'Completed')
                     AND rb.PaymentStatus = 'Paid'
                     AND MONTH(rb.BookingDate) = MONTH(CURRENT_DATE())
                     AND YEAR(rb.BookingDate) = YEAR(CURRENT_DATE())";
    $stmt = $conn->prepare($monthlyQuery);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $monthly = floatval($stmt->get_result()->fetch_assoc()['total']);
    $stmt->close();
    
    // Completed trips count
    $tripsQuery = "SELECT COUNT(*) as count 
                   FROM published_rides 
                   WHERE DriverID = ? AND Status = 'Completed'";
    $stmt = $conn->prepare($tripsQuery);
    $stmt->bind_param("i", $driverId);
    $stmt->execute();
    $completedTrips = intval($stmt->get_result()->fetch_assoc()['count']);
    $stmt->close();
    
    // Transaction history
    $transactionsQuery = "SELECT 
                            rb.BookingID,
                            rb.TotalFare as Amount,
                            rb.BookingDate as Date,
                            CONCAT('Payment for ride to ', pr.Destination, ' on ', 
                                   DATE_FORMAT(pr.RideDate, '%M %d, %Y')) as Description,
                            CONCAT(u.Fname, ' ', u.Lname) as PassengerName
                          FROM ride_bookings rb
                          JOIN published_rides pr ON rb.PublishedRideID = pr.PublishedRideID
                          LEFT JOIN user u ON rb.UserID = u.UserID
                          WHERE pr.DriverID = ? 
                          AND rb.BookingStatus IN ('Confirmed', 'Completed')
                          AND rb.PaymentStatus = 'Paid'
                          ORDER BY rb.BookingDate DESC
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

// Rate passenger (placeholder - create table if needed)
function ratePassenger($conn) {
    $rideId = intval($_POST['rideId'] ?? 0);
    $rating = intval($_POST['rating'] ?? 0);
    $comment = trim($_POST['comment'] ?? '');
    
    if ($rideId <= 0 || $rating < 1 || $rating > 5) {
        echo json_encode(['success' => false, 'message' => 'Invalid input']);
        return;
    }
    
    // This would need a ratings table - placeholder response
    echo json_encode(['success' => true, 'message' => 'Rating feature coming soon']);
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