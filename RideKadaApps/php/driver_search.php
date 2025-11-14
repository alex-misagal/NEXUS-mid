<?php
require "connect.php";

// Read POST values sent from home.php
$from = $_POST["fromLocation"] ?? "";
$to = $_POST["goingTo"] ?? "";
$date = $_POST["calendar"] ?? "";
$passengers = $_POST["passengerCount"] ?? "";

// Fetch ALL drivers from DB
$sql = "SELECT * FROM driver";
$result = $conn->query($sql);

$drivers = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {

        // PHP FILTERING — match destination (case insensitive)
        if (stripos($row["Destination"], $to) !== false) {
            $drivers[] = $row;
        }
    }
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Search Results - Nexus</title>
<style>
/* ← SAME CSS YOU PROVIDED ← */
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Arial,sans-serif;background:linear-gradient(to bottom,#a8d5e2,#e8f4f8);min-height:100vh;padding:20px;}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:40px;padding:20px 40px;}
.logo{font-size:32px;font-weight:bold;color:#000;}
.logo span{background:#1a5490;color:#fff;padding:5px 15px;margin-left:10px;}
.header-right{display:flex;align-items:center;gap:20px;}
.user-icon{width:40px;height:40px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #333;cursor:pointer;}
.container{max-width:1200px;margin:0 auto;padding:0 20px;}
.results-table{width:100%;background:white;border-collapse:collapse;box-shadow:0 2px 10px rgba(0,0,0,0.1);margin-bottom:30px;}
.results-table th,.results-table td{padding:15px;text-align:center;border:1px solid #ddd;}
.results-table tbody tr:hover{background:#e3f2fd;cursor:pointer;}
.selected{background:#bbdefb !important;border-left:4px solid #1a5490;}
.button-container{display:flex;justify-content:flex-end;gap:15px;}
.btn{padding:12px 35px;border:none;border-radius:5px;font-size:16px;font-weight:bold;cursor:pointer;background:#333;color:white;}
.btn:hover{opacity:0.8;}
.no-results{text-align:center;padding:20px;font-size:18px;color:#666;}
</style>

<script>
let selectedDriver = null;

// Row selection logic
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
    alert("Selected Driver ID: " + selectedDriver);
}

function handleCancel() {
    history.back();
}
</script>
</head>
<body>

<div class="header">
    <div class="logo">Search<span>Nexus</span></div>
    <div class="header-right">
        <input type="text" id="searchInput" class="search-box" placeholder="Search (UI only)">
        <div class="user-icon">👤</div>
    </div>
</div>

<div class="container">
    <table class="results-table">
        <thead>
            <tr>
                <th>Driver Name</th>
                <th>Going To</th>
                <th>Date</th>
                <th>Vehicle Capacity</th>
                <th>Contact</th>
            </tr>
        </thead>
        <tbody>

        <?php if (count($drivers) === 0): ?>
            <tr><td colspan="5" class="no-results">No matching drivers found.</td></tr>
        <?php else: ?>
            <?php foreach ($drivers as $d): ?>
                <tr onclick="selectRow(this, '<?php echo $d['DriverID']; ?>')">
                    <td><?php echo $d["Fname"] . " " . $d["Lname"]; ?></td>
                    <td><?php echo $d["Destination"]; ?></td>
                    <td><?php echo htmlspecialchars($date); ?></td>
                    <td><?php echo $d["Capacity"] . " People"; ?></td>
                    <td><?php echo $d["PhoneNumber"]; ?></td>
                </tr>
            <?php endforeach; ?>
        <?php endif; ?>

        </tbody>
    </table>

    <div class="button-container">
        <button class="btn btn-cancel" onclick="handleCancel()">Cancel</button>
        <button class="btn btn-ok" onclick="handleOk()">OK</button>
    </div>
</div>

</body>
</html>
