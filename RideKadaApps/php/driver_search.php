<?php
require "connect.php";

$from = trim($_POST["fromLocation"] ?? "");
$to = trim($_POST["goingTo"] ?? "");
$date = $_POST["calendar"] ?? "";
$passengers = intval($_POST["passengerCount"] ?? 0);

if (!$to || !$date || $passengers < 1) {
    die("<h2 style='text-align:center;color:red;'>Invalid search parameters.</h2>");
}

// JOIN driver + vehicle to get Capacity
$sql = "SELECT 
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
        FROM driver d 
        JOIN vehicle v ON d.VehicleID = v.VehicleID 
        WHERE 1=1";

$params = [];
$types = "";

if ($to) {
    $sql .= " AND d.Destination LIKE ?";
    $params[] = "%$to%";
    $types .= "s";
}

if ($passengers > 0) {
    $sql .= " AND v.Capacity >= ?";
    $params[] = $passengers;
    $types .= "i";
}

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
          <h3>Available Drivers</h3>
          <span class="results-count"><?php echo count($drivers); ?> driver(s) found</span>
        </div>

        <!-- Driver Cards Grid -->
        <div class="drivers-grid">
          <?php foreach ($drivers as $d): ?>
            <div class="driver-card" onclick="selectDriverCard(this, '<?php echo $d['DriverID']; ?>')">
              <!-- Card Header with Avatar -->
              <div class="driver-card-header">
                <div class="driver-avatar-large">
                  <?php echo strtoupper(substr($d['Fname'], 0, 1)); ?>
                </div>
                <div class="driver-name-card"><?php echo htmlspecialchars($d['Fname'] . ' ' . $d['Lname']); ?></div>
                <div class="driver-rating">
                  <span>⭐</span> 4.8 • 127 trips
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

                <!-- Vehicle -->
                <div class="info-row">
                  <div class="info-icon">🚗</div>
                  <div class="info-content">
                    <div class="info-label">Vehicle</div>
                    <div class="info-value"><?php echo htmlspecialchars($d['Color'] . ' ' . $d['Model']); ?></div>
                    <div class="vehicle-details"><?php echo htmlspecialchars($d['PlateNumber']); ?></div>
                  </div>
                </div>

                <!-- Available Seats -->
                <div class="info-row">
                  <div class="info-icon">👥</div>
                  <div class="info-content">
                    <div class="info-label">Available Seats</div>
                    <div class="info-value">
                      <span class="capacity-badge"><?php echo $d['Capacity']; ?> seats available</span>
                    </div>
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
              </div>

              <!-- Card Footer with Select Button -->
              <div class="driver-card-footer">
                <button class="select-driver-btn" onclick="event.stopPropagation(); selectDriverCard(this.parentElement.parentElement, '<?php echo $d['DriverID']; ?>')">
                  Select This Driver
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
            <label>No. of Passengers</label>
            <input type="text" id="modal-passengers" readonly>
          </div>
          
          <h3 class="modal-section-title" style="margin-top:30px;">Payment</h3>
          
          <div class="modal-field">
            <label>Estimated Fare</label>
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