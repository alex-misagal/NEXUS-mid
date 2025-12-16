let selectedDriver = null;

// Enable/disable book button based on selection
function updateBookButton() {
  const bookBtn = document.getElementById('bookBtn');
  if (bookBtn) {
    bookBtn.disabled = !selectedDriver;
    if (selectedDriver) {
      bookBtn.style.opacity = '1';
      bookBtn.style.cursor = 'pointer';
    } else {
      bookBtn.style.opacity = '0.6';
      bookBtn.style.cursor = 'not-allowed';
    }
  }
}

function selectDriverCard(card, driverId) {
  // Remove selection from all cards
  document.querySelectorAll(".driver-card").forEach(c => {
    c.classList.remove("selected");
    const btn = c.querySelector('.select-driver-btn');
    if (btn) {
      btn.textContent = 'Select This Driver';
    }
  });
  
  // Add selection to clicked card
  card.classList.add("selected");
  const selectedBtn = card.querySelector('.select-driver-btn');
  if (selectedBtn) {
    selectedBtn.textContent = '✓ Selected';
  }
  
  selectedDriver = driverId;
  
  // Enable book button and scroll to it
  updateBookButton();
  
  // Smooth scroll to booking button
  setTimeout(() => {
    const bookBtn = document.getElementById('bookBtn');
    if (bookBtn) {
      bookBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 300);
}

function openModal() {
  if (!selectedDriver) {
    alert("Please select a driver first");
    return;
  }
  
  const driver = driversData.find(d => d.DriverID == selectedDriver);
  if (!driver) return;

  // Calculate fare
  const baseFare = 50;
  const farePerPassenger = 17;
  const totalFare = baseFare + (searchParams.passengers * farePerPassenger);

  // Populate modal with data
  document.getElementById('modal-from').value = searchParams.from || "Maryheights";
  document.getElementById('modal-to').value = searchParams.to;
  document.getElementById('modal-date').value = searchParams.date;
  document.getElementById('modal-passengers').value = searchParams.passengers + " Person(s)";
  document.getElementById('modal-fare').value = "₱ " + totalFare.toFixed(2);
  document.getElementById('modal-status').value = (driver.Capacity - searchParams.passengers) + " of " + driver.Capacity + " seats available";
  
  // Driver information
  const driverInitial = driver.Fname.charAt(0).toUpperCase();
  document.getElementById('modal-driver-initial').textContent = driverInitial;
  document.getElementById('modal-driver-name').textContent = driver.Fname + " " + driver.Lname;
  document.getElementById('modal-driver-plate').textContent = driver.PlateNumber;
  document.getElementById('modal-driver-email').value = driver.Email || "Not provided";
  document.getElementById('modal-driver-phone').value = driver.PhoneNumber;
  document.getElementById('modal-driver-vehicle').value = driver.Color + " " + driver.Model;

  // Show modal
  document.getElementById('booking-modal').classList.add('active');
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('booking-modal').classList.remove('active');
  
  // Re-enable body scroll
  document.body.style.overflow = '';
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

  // Redirect to payment page
  window.location.href = '../Payment.html?' + params.toString();
}

function handleCancel() {
  if (confirm('Are you sure you want to cancel and go back?')) {
    window.history.back();
  }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
  const modal = document.getElementById('booking-modal');
  if (e.target === modal) {
    closeModal();
  }
});

// Close modal on escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  updateBookButton();
});