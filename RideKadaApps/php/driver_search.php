<?php
require "connect.php";

$from = trim($_POST["fromLocation"] ?? "");
$to = trim($_POST["goingTo"] ?? "");
$date = $_POST["calendar"] ?? "";
$passengers = intval($_POST["passengerCount"] ?? 0);

if (!$to || !$date || $passengers < 1) {
    die("<h2 style='text-align:center;color:red;'>Invalid search parameters.</h2>");
}

// Get published rides that match the search criteria
$sql = "SELECT 
            pr.PublishedRideID,
            pr.RideDate,
            pr.RideTime,
            pr.AvailableSeats,
            pr.PricePerSeat,
            pr.Notes,
            d.DriverID, 
            d.Fname, 
            d.Lname, 
            d.Destination, 
            d.PhoneNumber,
            d.Email,
            v.Capacity,
            v.PlateNumber,
            v.Model,
            v.Color
        FROM published_rides pr
        JOIN driver d ON pr.DriverID = d.DriverID
        JOIN vehicle v ON d.VehicleID = v.VehicleID 
        WHERE pr.Status = 'Available'
        AND d.Status = 'Active'
        AND pr.RideDate = ?
        AND pr.AvailableSeats >= ?";

$params = [$date, $passengers];
$types = "si";

if ($to) {
    $sql .= " AND pr.Destination LIKE ?";
    $params[] = "%$to%";
    $types .= "s";
}

$sql .= " ORDER BY pr.RideTime ASC";

$stmt = $conn->prepare($sql);
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$drivers = [];
while ($row = $result->fetch_assoc()) {
    $drivers[] = $row;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Search Results - RideKada</title>
  <link rel="stylesheet" href="../css/driver_search.css">
</head>
<body>

  <!-- Navigation (Same as home.html) -->
  <nav class="navbar">
    <div class="logo-section">
      <img src="../media/logo.png" alt="RideKada Logo" class="logo-circle">
      <span class="brand-name">RideKada</span>
    </div>

    <div class="user-section">
      <button class="publish-btn" onclick="window.location.href='../home.html'">Back to Home</button>
      <div class="user-icon">👤</div>
    </div>
  </nav>

  <div class="container">
    <!-- Page Header -->
    <div class="page-header">
      <h2>Available Rides</h2>
      <div class="search-summary">
        Showing rides from <strong>Maryheights</strong> to <strong><?php echo htmlspecialchars($to); ?></strong>
        on <strong><?php echo htmlspecialchars($date); ?></strong> for <strong><?php echo $passengers; ?> passenger(s)</strong>
      </div>
    </div>

    <!-- Results Section -->
    <div class="results-section">
      <?php if (empty($drivers)): ?>
        <div class="no-results">
          <div class="no-results-icon">🚗</div>
          <h3>No Rides Available</h3>
          <p>No drivers found from Maryheights to <?php echo htmlspecialchars($to); ?> on this date.</p>
          <p style="margin-top: 10px; font-size: 14px;">Try searching for a different destination or date.</p>
        </div>
        <div class="button-container">
          <button class="btn btn-cancel" onclick="handleCancel()">Go Back</button>
        </div>
      <?php else: ?>
        <div class="results-header">
          <h3>Available Rides</h3>
          <span class="results-count"><?php echo count($drivers); ?> ride(s) found</span>
        </div>

        <!-- Driver Cards Grid -->
        <div class="drivers-grid">
          <?php foreach ($drivers as $d): ?>
            <?php 
              $totalFare = $d['PricePerSeat'] * $passengers;
            ?>
            <div class="driver-card" onclick="selectDriverCard(this, '<?php echo $d['PublishedRideID']; ?>')">
              <!-- Card Header with Avatar -->
              <div class="driver-card-header">
                <div class="driver-avatar-large">
                  <?php echo strtoupper(substr($d['Fname'], 0, 1)); ?>
                </div>
                <div class="driver-name-card"><?php echo htmlspecialchars($d['Fname'] . ' ' . $d['Lname']); ?></div>
                <div class="driver-rating">
                  <span>⭐</span> 4.8 • <?php echo $d['AvailableSeats']; ?> seats available
                </div>
              </div>

              <!-- Card Body with Info -->
              <div class="driver-card-body">
                <!-- Destination -->
                <div class="info-row">
                  <div class="info-icon">📍</div>
                  <div class="info-content">
                    <div class="info-label">Destination</div>
                    <div class="info-value"><?php echo htmlspecialchars($d['Destination']); ?></div>
                  </div>
                </div>

                <!-- Date & Time -->
                <div class="info-row">
                  <div class="info-icon">📅</div>
                  <div class="info-content">
                    <div class="info-label">Date & Time</div>
                    <div class="info-value"><?php echo date('M d, Y', strtotime($d['RideDate'])); ?></div>
                    <div class="vehicle-details"><?php echo date('g:i A', strtotime($d['RideTime'])); ?></div>
                  </div>
                </div>

                <!-- Vehicle -->
                <div class="info-row">
                  <div class="info-icon">🚗</div>
                  <div class="info-content">
                    <div class="info-label">Vehicle</div>
                    <div class="info-value"><?php echo htmlspecialchars($d['Color'] . ' ' . $d['Model']); ?></div>
                    <div class="vehicle-details"><?php echo htmlspecialchars($d['PlateNumber']); ?></div>
                  </div>
                </div>

                <!-- Price -->
                <div class="info-row">
                  <div class="info-icon">💰</div>
                  <div class="info-content">
                    <div class="info-label">Price</div>
                    <div class="info-value">₱<?php echo number_format($d['PricePerSeat'], 2); ?> per seat</div>
                    <div class="vehicle-details">Total: ₱<?php echo number_format($totalFare, 2); ?></div>
                  </div>
                </div>

                <!-- Contact -->
                <div class="info-row">
                  <div class="info-icon">📞</div>
                  <div class="info-content">
                    <div class="info-label">Contact</div>
                    <div class="info-value"><?php echo htmlspecialchars($d['PhoneNumber']); ?></div>
                  </div>
                </div>

                <?php if ($d['Notes']): ?>
                <!-- Notes -->
                <div class="info-row">
                  <div class="info-icon">📝</div>
                  <div class="info-content">
                    <div class="info-label">Notes</div>
                    <div class="info-value" style="font-size: 13px;"><?php echo htmlspecialchars($d['Notes']); ?></div>
                  </div>
                </div>
                <?php endif; ?>
              </div>

              <!-- Card Footer with Select Button -->
              <div class="driver-card-footer">
                <button class="select-driver-btn" onclick="event.stopPropagation(); selectDriverCard(this.parentElement.parentElement, '<?php echo $d['PublishedRideID']; ?>')">
                  Select This Ride
                </button>
              </div>
            </div>
          <?php endforeach; ?>
        </div>

        <div class="button-container">
          <button class="btn btn-cancel" onclick="handleCancel()">Cancel Search</button>
          <button class="btn btn-ok" id="bookBtn" onclick="openModal()" disabled>Continue to Booking →</button>
        </div>
      <?php endif; ?>
    </div>
  </div>

  <!-- Booking Modal -->
  <div id="booking-modal" class="modal-overlay">
    <div class="modal-content">
      <button class="modal-close" onclick="closeModal()">×</button>
      
      <div class="modal-header">
        <h2>Confirm Your Booking</h2>
        <p>Review your ride details before booking</p>
      </div>
      
      <div class="modal-body">
        <!-- Left Section: Ride Details -->
        <div class="modal-left">
          <h3 class="modal-section-title">Ride Details</h3>
          
          <div class="modal-field">
            <label>From</label>
            <input type="text" id="modal-from" readonly>
          </div>
          
          <div class="modal-field">
            <label>Going To</label>
            <input type="text" id="modal-to" readonly>
          </div>
          
          <div class="modal-field">
            <label>Date</label>
            <input type="text" id="modal-date" readonly>
          </div>

          <div class="modal-field">
            <label>Time</label>
            <input type="text" id="modal-time" readonly>
          </div>
          
          <div class="modal-field">
            <label>No. of Passengers</label>
            <input type="text" id="modal-passengers" readonly>
          </div>
          
          <h3 class="modal-section-title" style="margin-top:30px;">Payment</h3>
          
          <div class="modal-field">
            <label>Price per Seat</label>
            <input type="text" id="modal-price-per-seat" readonly>
          </div>

          <div class="modal-field">
            <label>Total Fare</label>
            <input type="text" id="modal-fare" readonly>
          </div>
          
          <div class="modal-field">
            <label>Seat Status</label>
            <input type="text" id="modal-status" readonly>
          </div>
        </div>
        
        <!-- Right Section: Driver Info -->
        <div class="modal-right">
          <h3 class="modal-section-title">Driver Information</h3>
          
          <div class="driver-avatar-large">
            <span id="modal-driver-initial">D</span>
          </div>
          
          <div class="driver-name-large" id="modal-driver-name">John Doe</div>
          <div class="driver-plate" id="modal-driver-plate">ABC-123</div>
          
          <div class="modal-field">
            <label>Email</label>
            <input type="text" id="modal-driver-email" readonly>
          </div>
          
          <div class="modal-field">
            <label>Contact No.</label>
            <input type="text" id="modal-driver-phone" readonly>
          </div>
          
          <div class="modal-field">
            <label>Vehicle</label>
            <input type="text" id="modal-driver-vehicle" readonly>
          </div>
        </div>
      </div>
      
      <div class="modal-buttons">
        <button class="modal-btn modal-btn-cancel" onclick="closeModal()">Cancel</button>
        <button class="modal-btn modal-btn-book" onclick="confirmBooking()">Proceed to Payment</button>
      </div>
    </div>
  </div>

  <script>
    const driversData = <?php echo json_encode($drivers); ?>;
    const searchParams = {
      from: "<?php echo htmlspecialchars($from); ?>",
      to: "<?php echo htmlspecialchars($to); ?>",
      date: "<?php echo htmlspecialchars($date); ?>",
      passengers: <?php echo $passengers; ?>
    };
  </script>
  <script src="../javascript/driver_search.js"></script>

</body>
</html>