// Payment.js - Updated for confirmed bookings flow

document.addEventListener('DOMContentLoaded', function() {
  console.log('Payment page loaded');
  
  // Get booking data from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const bookingData = {
    bookingId: urlParams.get('bookingId'),
    referenceNumber: urlParams.get('referenceNumber'),
    totalFare: urlParams.get('totalFare'),
    from: urlParams.get('from'),
    to: urlParams.get('to'),
    date: urlParams.get('date'),
    time: urlParams.get('time'),
    passengers: urlParams.get('passengers'),
    driverName: urlParams.get('driverName'),
    driverPhone: urlParams.get('driverPhone'),
    vehicle: urlParams.get('vehicle'),
    plateNumber: urlParams.get('plateNumber')
  };

  console.log('Booking data loaded:', bookingData);

  // Validate required fields
  if (!bookingData.bookingId || !bookingData.totalFare) {
    alert('Invalid booking data. Please go back to My Bookings.');
    window.location.href = 'my_bookings.html';
    return;
  }

  // Display booking information
  displayBookingInfo(bookingData);
  
  // Setup payment method selection
  setupPaymentMethods();
  
  // Setup form submission
  setupPaymentSubmission(bookingData);
});

function displayBookingInfo(data) {
  // Format date and time
  const formattedDateTime = formatDateTime(data.date, data.time);
  
  // Update booking details in the UI
  document.getElementById('booking-reference').textContent = data.referenceNumber || 'N/A';
  document.getElementById('ride-route').textContent = `${data.from} → ${data.to}`;
  document.getElementById('ride-datetime').textContent = formattedDateTime;
  document.getElementById('ride-passengers').textContent = `${data.passengers} passenger(s)`;
  
  // Driver information
  document.getElementById('driver-name').textContent = data.driverName || 'N/A';
  document.getElementById('driver-phone').textContent = data.driverPhone || 'N/A';
  document.getElementById('driver-vehicle').textContent = `${data.vehicle} (${data.plateNumber})`;
  
  // Payment summary
  const totalFare = parseFloat(data.totalFare);
  const pricePerSeat = totalFare / parseInt(data.passengers);
  
  document.getElementById('price-per-seat').textContent = `₱${pricePerSeat.toFixed(2)}`;
  document.getElementById('total-passengers').textContent = data.passengers;
  document.getElementById('subtotal').textContent = `₱${totalFare.toFixed(2)}`;
  document.getElementById('booking-fee').textContent = '₱0.00';
  document.getElementById('total-amount').textContent = `₱${totalFare.toFixed(2)}`;
  
  // Also update the main total display
  const totalDisplays = document.querySelectorAll('.total-amount, .payment-total');
  totalDisplays.forEach(el => {
    el.textContent = `₱${totalFare.toFixed(2)}`;
  });
}

function formatDateTime(dateStr, timeStr) {
  const date = new Date(dateStr);
  const dateFormatted = date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const time = formatTime(timeStr);
  return `${dateFormatted} at ${time}`;
}

function formatTime(timeString) {
  const parts = timeString.split(':');
  let hours = parseInt(parts[0]);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

function setupPaymentMethods() {
  const paymentCards = document.querySelectorAll('.payment-card');
  
  paymentCards.forEach(card => {
    card.addEventListener('click', function() {
      // Remove selected class from all cards
      paymentCards.forEach(c => c.classList.remove('selected'));
      
      // Add selected class to clicked card
      this.classList.add('selected');
      
      // Get payment method
      const paymentMethod = this.dataset.method;
      console.log('Payment method selected:', paymentMethod);
      
      // Show/hide relevant payment details
      showPaymentDetails(paymentMethod);
    });
  });
}

function showPaymentDetails(method) {
  // Hide all payment detail sections
  document.querySelectorAll('.payment-details-section').forEach(section => {
    section.style.display = 'none';
  });
  
  // Show selected payment method details
  const detailSection = document.getElementById(`${method.toLowerCase()}-details`);
  if (detailSection) {
    detailSection.style.display = 'block';
  }
}

function setupPaymentSubmission(bookingData) {
  const payButton = document.getElementById('pay-now-btn');
  
  if (payButton) {
    payButton.addEventListener('click', function() {
      processPayment(bookingData);
    });
  }
}

async function processPayment(bookingData) {
  // Get selected payment method
  const selectedCard = document.querySelector('.payment-card.selected');
  
  if (!selectedCard) {
    alert('Please select a payment method');
    return;
  }
  
  const paymentMethod = selectedCard.dataset.method;
  
  // Get user data
  let currentUser = null;
  try {
    const userData = sessionStorage.getItem('user');
    if (userData) {
      currentUser = JSON.parse(userData);
    }
  } catch (e) {
    console.error('Failed to get user data:', e);
  }
  
  if (!currentUser || !currentUser.UserID) {
    alert('Please login to complete payment');
    window.location.href = 'index.html';
    return;
  }
  
  // Prepare payment data
  const paymentData = {
    bookingId: parseInt(bookingData.bookingId),
    userId: parseInt(currentUser.UserID),
    totalFare: parseFloat(bookingData.totalFare),
    paymentMethod: paymentMethod
  };
  
  console.log('Processing payment:', paymentData);
  
  // Disable button and show loading
  const payButton = document.getElementById('pay-now-btn');
  const originalText = payButton.textContent;
  payButton.disabled = true;
  payButton.textContent = 'Processing...';
  
  try {
    const response = await fetch('php/process_booking_payment.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });
    
    const result = await response.json();
    console.log('Payment response:', result);
    
    if (result.success) {
      showPaymentSuccess(result, bookingData);
    } else {
      alert('Payment failed: ' + result.message);
      payButton.disabled = false;
      payButton.textContent = originalText;
    }
  } catch (error) {
    console.error('Payment error:', error);
    alert('Payment processing failed. Please try again.');
    payButton.disabled = false;
    payButton.textContent = originalText;
  }
}

function showPaymentSuccess(result, bookingData) {
  // Create success modal
  const successHTML = `
    <div class="modal-overlay" id="paymentSuccessModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; align-items: center; justify-content: center;">
      <div class="modal-content" style="background: white; max-width: 550px; width: 90%; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
        
        <!-- Success Icon -->
        <div style="font-size: 80px; color: #2ecc71; margin-bottom: 20px;">✓</div>
        
        <!-- Title -->
        <h2 style="color: #2ecc71; margin-bottom: 15px; font-size: 28px; font-weight: 700;">Payment Successful!</h2>
        
        <!-- Transaction Details -->
        <p style="font-size: 16px; color: #666; margin-bottom: 25px;">
          Your payment has been processed successfully.<br>
          <strong style="color: #333; font-size: 18px;">Transaction: ${result.transactionId || bookingData.referenceNumber}</strong>
        </p>
        
        <!-- Payment Summary -->
        <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 25px; text-align: left; border: 2px solid #e9ecef;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px; font-weight: 600; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">💳 Payment Summary</h3>
          <p style="margin: 10px 0; color: #555; font-size: 14px;">
            <strong>Amount Paid:</strong> ₱${parseFloat(bookingData.totalFare).toFixed(2)}
          </p>
          <p style="margin: 10px 0; color: #555; font-size: 14px;">
            <strong>Booking Reference:</strong> ${bookingData.referenceNumber}
          </p>
          <p style="margin: 10px 0; color: #555; font-size: 14px;">
            <strong>Route:</strong> ${bookingData.from} → ${bookingData.to}
          </p>
          <p style="margin: 10px 0; color: #555; font-size: 14px;">
            <strong>Date:</strong> ${formatDateTime(bookingData.date, bookingData.time)}
          </p>
        </div>
        
        <!-- Success Notice -->
        <div style="background: #d4edda; border-left: 4px solid #2ecc71; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: left;">
          <p style="margin: 0; color: #155724; font-size: 15px; line-height: 1.6;">
            <strong style="font-size: 16px;">🎉 Booking Confirmed!</strong><br><br>
            Your ride is now confirmed. The driver has been notified. Please arrive at the pickup location on time.<br><br>
            <em>You can view your booking details in "My Bookings".</em>
          </p>
        </div>
        
        <!-- Action Buttons -->
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
          <button onclick="goToMyBookings()" style="background: #3498db; color: white; padding: 14px 32px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);">
            📋 View My Bookings
          </button>
          <button onclick="goToHome()" style="background: #2ecc71; color: white; padding: 14px 32px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);">
            🏠 Back to Home
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', successHTML);
}

function goToMyBookings() {
  window.location.href = 'my_bookings.html';
}

function goToHome() {
  window.location.href = 'home.html';
}