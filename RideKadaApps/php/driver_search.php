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
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Poppins', Arial, sans-serif; background: linear-gradient(to bottom, #a8d5e2, #e8f4f8); min-height:100vh; padding:20px; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:40px; padding:20px 40px; background:white; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.1); }
    .logo { font-size:32px; font-weight:bold; color:#000; }
    .logo span { background:#0077ff; color:#fff; padding:5px 15px; margin-left:10px; border-radius:8px; }
    .header-right { display:flex; align-items:center; gap:20px; }
    .search-box { padding:10px; border:1px solid #ccc; border-radius:8px; width:200px; }
    .user-icon { width:40px; height:40px; background:#0077ff; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; cursor:pointer; }

    .container { max-width:1200px; margin:0 auto; padding:0 20px; }
    .results-table { width:100%; background:white; border-collapse:collapse; box-shadow:0 2px 10px rgba(0,0,0,0.1); margin-bottom:30px; border-radius:12px; overflow:hidden; }
    .results-table th, .results-table td { padding:15px; text-align:center; border-bottom:1px solid #eee; }
    .results-table th { background:#0077ff; color:white; }
    .results-table tbody tr:hover { background:#f0f8ff; cursor:pointer; }
    .selected { background:#bbdefb !important; border-left:4px solid #0077ff; }
    .no-results { text-align:center; padding:30px; font-size:18px; color:#666; }

    .button-container { display:flex; justify-content:flex-end; gap:15px; margin-top:20px; }
    .btn { padding:12px 35px; border:none; border-radius:8px; font-size:16px; font-weight:bold; cursor:pointer; transition:0.2s; }
    .btn-cancel { background:#666; color:white; }
    .btn-ok { background:#0077ff; color:white; }
    .btn:hover { opacity:0.9; }

    /* Modal Styles */
    .modal-overlay { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; align-items:center; justify-content:center; }
    .modal-overlay.active { display:flex; }
    .modal-content { background:white; border-radius:16px; width:90%; max-width:600px; max-height:90vh; overflow-y:auto; box-shadow:0 10px 40px rgba(0,0,0,0.3); position:relative; }
    .modal-close { position:absolute; top:15px; right:15px; background:transparent; border:none; font-size:32px; cursor:pointer; color:#666; line-height:1; }
    .modal-close:hover { color:#000; }
    .modal-body { display:flex; padding:30px; }
    .modal-left { flex:1; padding-right:20px; border-right:2px solid #eee; }
    .modal-right { flex:1; padding-left:20px; display:flex; flex-direction:column; align-items:center; }
    .modal-section-title { font-size:20px; font-weight:bold; margin-bottom:20px; color:#000; }
    .modal-field { margin-bottom:15px; }
    .modal-field label { display:block; font-size:12px; color:#666; margin-bottom:5px; }
    .modal-field input { width:100%; padding:10px; border:1px solid #ccc; border-radius:6px; font-size:14px; }
    .driver-avatar { width:120px; height:120px; border-radius:50%; background:#0077ff; display:flex; align-items:center; justify-content:center; margin-bottom:15px; }
    .driver-avatar-icon { font-size:60px; color:white; }
    .driver-name { font-size:18px; font-weight:bold; margin-bottom:5px; }
    .driver-plate { font-size:14px; color:#666; margin-bottom:20px; }
    .modal-buttons { display:flex; gap:15px; justify-content:flex-end; padding:20px 30px; border-top:1px solid #eee; }
    .modal-btn { padding:10px 30px; border:none; border-radius:6px; font-size:14px; font-weight:bold; cursor:pointer; }
    .modal-btn-cancel { background:#666; color:white; }
    .modal-btn-book { background:#0077ff; color:white; }
  </style>

  <script>
    let selectedDriver = null;
    const driversData = <?php echo json_encode($drivers); ?>;
    const searchParams = {
      from: "<?php echo htmlspecialchars($from); ?>",
      to: "<?php echo htmlspecialchars($to); ?>",
      date: "<?php echo htmlspecialchars($date); ?>",
      passengers: <?php echo $passengers; ?>
    };

    function selectRow(row, driverId) {
      document.querySelectorAll("tbody tr").forEach(r => r.classList.remove("selected"));
      row.classList.add("selected");
      selectedDriver = driverId;
    }

    function openModal() {
      if (!selectedDriver) {
        alert("Please select a driver first");
        return;
      }
      
      const driver = driversData.find(d => d.DriverID == selectedDriver);
      if (!driver) return;

      // Populate modal with data
      document.getElementById('modal-from').value = searchParams.from || "Maryheights";
      document.getElementById('modal-to').value = searchParams.to;
      document.getElementById('modal-date').value = searchParams.date;
      document.getElementById('modal-passengers').value = searchParams.passengers + " People";
      document.getElementById('modal-fare').value = "₱ 0.00"; // You can calculate fare based on your logic
      document.getElementById('modal-status').value = driver.Capacity - searchParams.passengers + " of " + driver.Capacity + " seats available";
      
      document.getElementById('modal-driver-name').textContent = driver.Fname + " " + driver.Lname;
      document.getElementById('modal-driver-plate').textContent = driver.PlateNumber;
      document.getElementById('modal-driver-email').value = driver.Email || "";
      document.getElementById('modal-driver-phone').value = driver.PhoneNumber;
      document.getElementById('modal-driver-vehicle').value = driver.Color + " " + driver.Model;

      document.getElementById('booking-modal').classList.add('active');
    }

    function closeModal() {
      document.getElementById('booking-modal').classList.remove('active');
    }

    function confirmBooking() {
      alert("Booking confirmed for Driver ID: " + selectedDriver);
      closeModal();
      // Here you can add code to submit the booking to the server
    }

    function handleCancel() {
      window.history.back();
    }

    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
      const modal = document.getElementById('booking-modal');
      if (e.target === modal) {
        closeModal();
      }
    });
  </script>
</head>
<body>

<div class="header">
  <div class="logo">Ride<span>Kada</span></div>
  <div class="header-right">
    <input type="text" class="search-box" placeholder="Search drivers...">
    <div class="user-icon">Profile</div>
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

</body>
</html>