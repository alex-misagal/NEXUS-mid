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
  <title>Search Results - RideKada</title>
  <link rel="stylesheet" href="../css/driver_search.css">
</head>
<body>

<div class="header">s
  <div class="logo">Ride<span>Kada</span></div>
  <div class="header-right">
    <input type="text" class="search-box" placeholder="Search drivers...">
    <div class="user-icon">👤</div>
  </div>
</div>

<div class="container">
  <?php if (empty($drivers)): ?>
    <p class="no-results">No drivers found from Maryheights to <?php echo htmlspecialchars($to); ?>.</p>
  <?php else: ?>
    <table class="results-table">
      <thead>
        <tr>
          <th>Driver Name</th>
          <th>Going To</th>
          <th>Date</th>
          <th>Capacity</th>
          <th>Contact</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($drivers as $d): ?>
          <tr onclick="selectRow(this, '<?php echo $d['DriverID']; ?>')">
            <td><?php echo htmlspecialchars($d['Fname'] . ' ' . $d['Lname']); ?></td>
            <td><?php echo htmlspecialchars($d['Destination']); ?></td>
            <td><?php echo htmlspecialchars($date); ?></td>
            <td><?php echo $d['Capacity']; ?> seats</td>
            <td><?php echo htmlspecialchars($d['PhoneNumber']); ?></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>

  <div class="button-container">
    <button class="btn btn-cancel" onclick="handleCancel()">Cancel</button>
    <button class="btn btn-ok" onclick="openModal()">Book Ride</button>
  </div>
</div>

<!-- Booking Modal -->
<div id="booking-modal" class="modal-overlay">
  <div class="modal-content">
    <button class="modal-close" onclick="closeModal()">×</button>
    
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
          <label>Fare</label>
          <input type="text" id="modal-fare" readonly>
        </div>
        
        <div class="modal-field">
          <label>Status</label>
          <input type="text" id="modal-status" readonly>
        </div>
      </div>
      
      <!-- Right Section: Driver Info -->
      <div class="modal-right">
        <h3 class="modal-section-title" style="width:100%;">Driver</h3>
        
        <div class="driver-avatar">
          <span class="driver-avatar-icon">👤</span>
        </div>
        
        <div class="driver-name" id="modal-driver-name">James Doe</div>
        <div class="driver-plate" id="modal-driver-plate">ABC-123</div>
        
        <div class="modal-field" style="width:100%;">
          <label>Email</label>
          <input type="text" id="modal-driver-email" readonly>
        </div>
        
        <div class="modal-field" style="width:100%;">
          <label>Contact No.</label>
          <input type="text" id="modal-driver-phone" readonly>
        </div>
        
        <div class="modal-field" style="width:100%;">
          <label>Vehicle</label>
          <input type="text" id="modal-driver-vehicle" readonly>
        </div>
      </div>
    </div>
    
    <div class="modal-buttons">
      <button class="modal-btn modal-btn-cancel" onclick="closeModal()">Cancel</button>
      <button class="modal-btn modal-btn-book" onclick="confirmBooking()">Book</button>
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