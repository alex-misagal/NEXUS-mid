let selectedPaymentMethod = 'GCash';
let bookingData = {};

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);

// Extract booking data from URL
bookingData = {
  driverId: urlParams.get('driverId'),
  driverName: urlParams.get('driverName'),
  driverPhone: urlParams.get('driverPhone'),
  driverEmail: urlParams.get('driverEmail'),
  vehicle: urlParams.get('vehicle'),
  plateNumber: urlParams.get('plateNumber'),
  from: urlParams.get('from'),
  to: urlParams.get('to'),
  date: urlParams.get('date'),
  passengers: urlParams.get('passengers'),
  fare: urlParams.get('fare'),
  availableSeats: urlParams.get('availableSeats'),
  totalSeats: urlParams.get('totalSeats')
};

// Populate fields with booking data
window.onload = function() {
  if (bookingData.fare) {
    document.getElementById('amountDisplay').textContent = `₱${parseFloat(bookingData.fare).toFixed(2)}`;
  }
  
  if (bookingData.driverName) {
    document.getElementById('driverName').value = bookingData.driverName;
  }
  
  if (bookingData.driverPhone) {
    document.getElementById('driverPhone').value = bookingData.driverPhone;
  }
  
  if (bookingData.vehicle) {
    document.getElementById('vehicle').value = bookingData.vehicle + ' (' + bookingData.plateNumber + ')';
  }
  
  if (bookingData.from) {
    document.getElementById('fromLocation').value = bookingData.from;
  }
  
  if (bookingData.to) {
    document.getElementById('destination').value = bookingData.to;
  }
  
  if (bookingData.date) {
    document.getElementById('rideDate').value = bookingData.date;
  }
  
  if (bookingData.passengers) {
    document.getElementById('passengers').value = bookingData.passengers + ' passenger(s)';
  }
  
  updatePayButton();
};

function selectPayment(method, element) {
  // Remove selected class from all options
  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.classList.remove('selected');
    opt.querySelector('input').checked = false;
  });

  // Add selected class to clicked option
  element.classList.add('selected');
  element.querySelector('input').checked = true;
  selectedPaymentMethod = method;
  
  updatePayButton();
}

function updatePayButton() {
  const amountText = document.getElementById('amountDisplay').textContent;
  document.getElementById('payBtn').textContent = `Pay ${amountText} Via ${selectedPaymentMethod}`;
}

function showCancelModal() {
  document.getElementById('cancelModal').style.display = 'flex';
}

function closeCancelModal() {
  document.getElementById('cancelModal').style.display = 'none';
}

function confirmCancel() {
  closeCancelModal();
  // Redirect back to home
  window.location.href = 'home.html';
}

async function processPayment() {
  const payBtn = document.getElementById('payBtn');
  payBtn.disabled = true;
  payBtn.textContent = 'Processing...';

  // Simulate payment processing
  setTimeout(() => {
    // In a real implementation, you would:
    // 1. Create a booking record in the database
    // 2. Create a payment record
    // 3. Update driver availability
    // 4. Send confirmation email/SMS
    
    // For now, we'll just show the success modal
    document.getElementById('successModal').style.display = 'flex';
  }, 1500);
}

// Close modal when clicking outside
window.onclick = function(event) {
  const cancelModal = document.getElementById('cancelModal');
  const successModal = document.getElementById('successModal');
  
  if (event.target === cancelModal) {
    closeCancelModal();
  }
  if (event.target === successModal) {
    window.location.href = 'home.html';
  }
}