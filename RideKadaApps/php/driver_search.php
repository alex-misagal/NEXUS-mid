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
            v.Capacity 
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
  </style>

  <script>
    let selectedDriver = null;

    function selectRow(row, driverId) {
      document.querySelectorAll("tbody tr").forEach(r => r.classList.remove("selected"));
      row.classList.add("selected");
      selectedDriver = driverId;
    }

    function handleOk() {
      if (!selectedDriver) {
        alert("Please select a driver first");
        return;
      }
      alert("Booking confirmed for Driver ID: " + selectedDriver);
    }

    function handleCancel() {
      window.history.back();
    }
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
    <p class="no-results">No drivers found from Msryheights to <?php echo htmlspecialchars($to); ?>.</p>
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
    <button class="btn btn-ok" onclick="handleOk()">Book Ride</button>
  </div>
</div>

</body>
</html>