let selectedDriver = null;

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
  document.getElementById('modal-status').value = (driver.Capacity - searchParams.passengers) + " of " + driver.Capacity + " seats available";
  
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
  if (!selectedDriver) {
    alert("Please select a driver first");
    return;
  }
  
  const driver = driversData.find(d => d.DriverID == selectedDriver);
  if (!driver) return;

  // Calculate a sample fare
  const baseFare = 50;
  const farePerPassenger = 17;
  const totalFare = baseFare + (searchParams.passengers * farePerPassenger);

  // Build URL with booking details
  const params = new URLSearchParams({
    driverId: driver.DriverID,
    driverName: driver.Fname + ' ' + driver.Lname,
    driverPhone: driver.PhoneNumber,
    driverEmail: driver.Email || '',
    vehicle: driver.Color + ' ' + driver.Model,
    plateNumber: driver.PlateNumber,
    from: searchParams.from || 'Maryheights',
    to: searchParams.to,
    date: searchParams.date,
    passengers: searchParams.passengers,
    fare: totalFare.toFixed(2),
    availableSeats: driver.Capacity - searchParams.passengers,
    totalSeats: driver.Capacity
  });

  // Redirect to payment page (go up one directory level)
  window.location.href = '../Payment.html?' + params.toString();
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