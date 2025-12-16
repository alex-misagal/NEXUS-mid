let selectedRide = null;
let selectedRideData = null;

function updateBookButton() {
  const bookBtn = document.getElementById('bookBtn');
  if (bookBtn) {
    bookBtn.disabled = !selectedRide;
    if (selectedRide) {
      bookBtn.style.opacity = '1';
      bookBtn.style.cursor = 'pointer';
    } else {
      bookBtn.style.opacity = '0.6';
      bookBtn.style.cursor = 'not-allowed';
    }
  }
}

function selectDriverCard(card, publishedRideId) {
  document.querySelectorAll(".driver-card").forEach(c => {
    c.classList.remove("selected");
    const btn = c.querySelector('.select-driver-btn');
    if (btn) {
      btn.textContent = 'Select This Ride';
    }
  });
  
  card.classList.add("selected");
  const selectedBtn = card.querySelector('.select-driver-btn');
  if (selectedBtn) {
    selectedBtn.textContent = '✓ Selected';
  }
  
  selectedRide = publishedRideId;
  selectedRideData = ridesData.find(r => r.PublishedRideID == publishedRideId);
  
  updateBookButton();
  
  setTimeout(() => {
    const bookBtn = document.getElementById('bookBtn');
    if (bookBtn) {
      bookBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 300);
}

function openModal() {
  if (!selectedRide || !selectedRideData) {
    alert("Please select a ride first");
    return;
  }

  const ride = selectedRideData;
  const pricePerSeat = parseFloat(ride.PricePerSeat);
  const totalFare = pricePerSeat * searchParams.passengers;

  document.getElementById('modal-from').value = searchParams.from || "Maryheights";
  document.getElementById('modal-to').value = ride.Destination;
  document.getElementById('modal-date').value = searchParams.date;
  
  const rideTime = ride.RideTime || '00:00:00';
  const formattedTime = formatTime(rideTime);
  document.getElementById('modal-time').value = formattedTime;
  
  document.getElementById('modal-passengers').value = searchParams.passengers + " Person(s)";
  document.getElementById('modal-price-per-seat').value = "₱ " + pricePerSeat.toFixed(2);
  document.getElementById('modal-fare').value = "₱ " + totalFare.toFixed(2);
  document.getElementById('modal-status').value = ride.AvailableSeats + " seats available";
  
  const driverInitial = ride.Fname.charAt(0).toUpperCase();
  document.getElementById('modal-driver-initial').textContent = driverInitial;
  document.getElementById('modal-driver-name').textContent = ride.Fname + " " + ride.Lname;
  document.getElementById('modal-driver-plate').textContent = ride.PlateNumber;
  document.getElementById('modal-driver-email').value = ride.Email || "Not provided";
  document.getElementById('modal-driver-phone').value = ride.PhoneNumber;
  document.getElementById('modal-driver-vehicle').value = ride.Color + " " + ride.Model;

  document.getElementById('booking-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function formatTime(timeString) {
  const parts = timeString.split(':');
  let hours = parseInt(parts[0]);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return hours + ':' + minutes + ' ' + ampm;
}

function closeModal() {
  document.getElementById('booking-modal').classList.remove('active');
  document.body.style.overflow = '';
}

async function confirmBooking() {
  if (!selectedRide || !selectedRideData) {
    alert("Please select a ride first");
    return;
  }

  const ride = selectedRideData;
  const pricePerSeat = parseFloat(ride.PricePerSeat);
  const totalFare = pricePerSeat * searchParams.passengers;

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
    alert('Please login to create a booking');
    window.location.href = '../index.html';
    return;
  }

  const bookBtn = document.querySelector('.modal-btn-book');
  const originalText = bookBtn.textContent;
  bookBtn.disabled = true;
  bookBtn.textContent = 'Creating Booking...';

  const bookingData = {
    publishedRideId: ride.PublishedRideID,
    userId: currentUser.UserID,
    passengers: searchParams.passengers,
    totalFare: totalFare
  };

  try {
    const response = await fetch('../php/create_booking.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    });

    const result = await response.json();

    if (result.success) {
      closeModal();
      showSuccessMessage(result);
    } else {
      alert('Booking failed: ' + result.message);
      bookBtn.disabled = false;
      bookBtn.textContent = originalText;
    }
  } catch (error) {
    console.error('Booking error:', error);
    alert('Failed to create booking. Please try again.');
    bookBtn.disabled = false;
    bookBtn.textContent = originalText;
  }
}

function showSuccessMessage(result) {
  // Create success modal overlay
  const successHTML = `
    <div class="modal-overlay" id="successModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; align-items: center; justify-content: center;">
      <div class="modal-content" style="background: white; max-width: 550px; width: 90%; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;">
        
        <!-- Success Icon -->
        <div style="font-size: 80px; color: #2ecc71; margin-bottom: 20px; animation: scaleIn 0.5s ease;">✓</div>
        
        <!-- Title -->
        <h2 style="color: #2ecc71; margin-bottom: 15px; font-size: 28px; font-weight: 700;">Booking Request Submitted!</h2>
        
        <!-- Reference Number -->
        <p style="font-size: 16px; color: #666; margin-bottom: 25px;">
          Your booking request has been sent to the driver.<br>
          <strong style="color: #333; font-size: 18px;">Reference: ${result.referenceNumber}</strong>
        </p>
        
        <!-- Ride Details Card -->
        <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 25px; text-align: left; border: 2px solid #e9ecef;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px; font-weight: 600; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">📋 Ride Details</h3>
          <p style="margin: 10px 0; color: #555; font-size: 14px;">
            <strong>Destination:</strong> ${result.rideDetails.destination}
          </p>
          <p style="margin: 10px 0; color: #555; font-size: 14px;">
            <strong>Date & Time:</strong> ${formatDate(result.rideDetails.rideDate)} at ${formatTime(result.rideDetails.rideTime)}
          </p>
          <p style="margin: 10px 0; color: #555; font-size: 14px;">
            <strong>Driver:</strong> ${result.rideDetails.driverName}
          </p>
          <p style="margin: 10px 0; color: #555; font-size: 14px;">
            <strong>Vehicle:</strong> ${result.rideDetails.vehicle} (${result.rideDetails.plateNumber})
          </p>
        </div>
        
        <!-- Warning Notice -->
        <div style="background: #fff3cd; border-left: 4px solid #f39c12; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: left;">
          <p style="margin: 0; color: #856404; font-size: 15px; line-height: 1.6;">
            <strong style="font-size: 16px;">⏳ Waiting for Driver Confirmation</strong><br><br>
            Your booking is currently <strong>PENDING</strong>. You will be able to proceed with payment once the driver accepts your booking request.<br><br>
            <em>Check "My Bookings" to see the status.</em>
          </p>
        </div>
        
        <!-- Action Buttons -->
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
          <button onclick="goToBookings()" style="background: #2ecc71; color: white; padding: 14px 32px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);">
            📋 View My Bookings
          </button>
          <button onclick="closeSuccessModal()" style="background: #3498db; color: white; padding: 14px 32px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.3s; box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);">
            🏠 Back to Home
          </button>
        </div>
      </div>
    </div>
    
    <style>
      @keyframes slideIn {
        from {
          transform: translateY(-50px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes scaleIn {
        from {
          transform: scale(0);
        }
        to {
          transform: scale(1);
        }
      }
    </style>
  `;
  
  document.body.insertAdjacentHTML('beforeend', successHTML);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function goToBookings() {
  window.location.href = '../my_bookings.html';
}

function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) {
    modal.remove();
  }
  // Redirect to home
  window.location.href = '../home.html';
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