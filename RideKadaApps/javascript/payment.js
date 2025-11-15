let selectedPaymentMethod = 'GCash';
let bookingData = {};
const ADDITIONAL_PERSON_FEE = 15; // Fee per additional person

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
  passengers: parseInt(urlParams.get('passengers')) || 1,
  fare: parseFloat(urlParams.get('fare')) || 0,
  availableSeats: urlParams.get('availableSeats'),
  totalSeats: urlParams.get('totalSeats')
};

// Calculate total fare with additional person fees
function calculateTotalFare() {
  const baseFare = bookingData.fare;
  const passengers = bookingData.passengers;
  
  // Add ₱15 for each additional person beyond 1
  const additionalPersons = passengers > 1 ? passengers - 1 : 0;
  const additionalFees = additionalPersons * ADDITIONAL_PERSON_FEE;
  
  return baseFare + additionalFees;
}

// Populate fields with booking data
window.onload = function() {
  const totalFare = calculateTotalFare();
  
  document.getElementById('amountDisplay').textContent = `₱${totalFare.toFixed(2)}`;
  
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
    const additionalPersons = bookingData.passengers > 1 ? bookingData.passengers - 1 : 0;
    const passengersText = bookingData.passengers + ' passenger(s)';
    const feeText = additionalPersons > 0 ? ` (+ ₱${additionalPersons * ADDITIONAL_PERSON_FEE} for ${additionalPersons} additional)` : '';
    document.getElementById('passengers').value = passengersText + feeText;
  }
  
  // Disable cash option
  const cashOption = document.querySelector('.payment-option[onclick*="Cash"]');
  if (cashOption) {
    cashOption.style.opacity = '0.5';
    cashOption.style.cursor = 'not-allowed';
    cashOption.onclick = null;
    const cashRadio = cashOption.querySelector('input[type="radio"]');
    if (cashRadio) {
      cashRadio.disabled = true;
    }
  }
  
  updatePayButton();
};

function selectPayment(method, element) {
  // Don't allow cash selection
  if (method === 'Cash') {
    return;
  }
  
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

function showPaymentConfirmModal() {
  const totalFare = calculateTotalFare();
  document.getElementById('confirmPaymentAmount').textContent = `₱${totalFare.toFixed(2)}`;
  document.getElementById('confirmPaymentMethod').textContent = selectedPaymentMethod;
  document.getElementById('paymentConfirmModal').style.display = 'flex';
}

function closePaymentConfirmModal() {
  document.getElementById('paymentConfirmModal').style.display = 'none';
}

async function processPayment() {
  // Show confirmation modal first
  showPaymentConfirmModal();
}

async function confirmPayment() {
  closePaymentConfirmModal();
  
  const payBtn = document.getElementById('payBtn');
  payBtn.disabled = true;
  payBtn.textContent = 'Processing...';

  const totalFare = calculateTotalFare();

  // Simulate payment processing with timeout
  setTimeout(async () => {
    try {
      const response = await fetch('process_payment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId: bookingData.driverId,
          driverName: bookingData.driverName,
          driverPhone: bookingData.driverPhone,
          driverEmail: bookingData.driverEmail,
          vehicle: bookingData.vehicle,
          plateNumber: bookingData.plateNumber,
          from: bookingData.from,
          to: bookingData.to,
          date: bookingData.date,
          passengers: bookingData.passengers,
          fare: totalFare,
          paymentMethod: selectedPaymentMethod,
          availableSeats: bookingData.availableSeats
        })
      });

      const result = await response.json();

      if (result.success) {
        document.getElementById('successModal').style.display = 'flex';
      } else {
        alert('Payment failed: ' + result.message);
        payBtn.disabled = false;
        updatePayButton();
      }
    } catch (error) {
      console.error('Payment error:', error);
      // For demo purposes, show success anyway
      
      document.getElementById('successModal').style.display = 'flex';
    }
  }, 1500);
}

// Close modal when clicking outside
window.onclick = function(event) {
  const cancelModal = document.getElementById('cancelModal');
  const successModal = document.getElementById('successModal');
  const paymentConfirmModal = document.getElementById('paymentConfirmModal');
  
  if (event.target === cancelModal) {
    closeCancelModal();
  }
  if (event.target === successModal) {
    window.location.href = 'home.html';
  }
  if (event.target === paymentConfirmModal) {
    closePaymentConfirmModal();
  }
}