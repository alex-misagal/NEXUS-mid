// Driver Dashboard JavaScript

let currentDriver = null;
let currentBookingFilter = 'pending';
let currentRideFilter = 'upcoming';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  currentDriver = getStoredUser();
  
  if (!currentDriver || currentDriver.UserType !== 'Driver') {
    alert('Please login as a driver to access this page');
    window.location.href = 'index.html';
    return;
  }
  
  initializeDashboard();
  loadDashboardStats();
  loadNotifications();
  
  // Setup event listeners
  setupSidebarNavigation();
  setupProfileDropdown();
  setupNotificationPanel();
  setupPublishRideForm();
  setupTabFilters();
  
  // Auto-refresh data every 30 seconds
  setInterval(() => {
    loadDashboardStats();
    loadNotifications();
    refreshCurrentView();
  }, 30000);
});

// Initialize dashboard
function initializeDashboard() {
  // Set minimum date for ride publishing
  const dateInput = document.querySelector('[name="rideDate"]');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    dateInput.value = today;
  }
}

// Get stored user from session
function getStoredUser() {
  try {
    const data = sessionStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to parse user from sessionStorage', e);
    return null;
  }
}

// Setup sidebar navigation
function setupSidebarNavigation() {
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', function() {
      const view = this.dataset.view;
      switchView(view);
      
      // Update active state
      document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

// Switch between views
function switchView(viewName) {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  
  // Show selected view
  const viewMap = {
    'dashboard': 'dashboardView',
    'publish-ride': 'publishRideView',
    'bookings': 'bookingsView',
    'rides': 'ridesView',
    'passengers': 'passengersView',
    'earnings': 'earningsView'
  };
  
  const viewId = viewMap[viewName];
  if (viewId) {
    document.getElementById(viewId).classList.add('active');
    
    // Load data for specific views
    switch(viewName) {
      case 'bookings':
        loadBookings(currentBookingFilter);
        break;
      case 'rides':
        loadRides(currentRideFilter);
        break;
      case 'passengers':
        loadPassengers();
        break;
      case 'earnings':
        loadEarnings();
        break;
    }
  }
}

// Setup profile dropdown
function setupProfileDropdown() {
  const userIcon = document.getElementById('userIcon');
  const dropdown = document.getElementById('profileDropdown');
  const logoutLink = document.getElementById('logoutLink');
  
  if (userIcon && dropdown) {
    userIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
  }
  
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!userIcon.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });
}

// Setup notification panel
function setupNotificationPanel() {
  const notificationBtn = document.getElementById('notificationBtn');
  const notificationPanel = document.getElementById('notificationPanel');
  const closeBtn = document.getElementById('closeNotifications');
  
  if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
      notificationPanel.classList.add('active');
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      notificationPanel.classList.remove('active');
    });
  }
}

// Setup publish ride form
function setupPublishRideForm() {
  const form = document.getElementById('publishRideForm');
  if (form) {
    form.addEventListener('submit', handlePublishRide);
  }
}

// Setup tab filters
function setupTabFilters() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const filter = this.dataset.filter;
      const parentView = this.closest('.view');
      
      // Update active tab
      parentView.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Load filtered data
      if (parentView.id === 'bookingsView') {
        currentBookingFilter = filter;
        loadBookings(filter);
      } else if (parentView.id === 'ridesView') {
        currentRideFilter = filter;
        loadRides(filter);
      }
    });
  });
}

// Load dashboard stats
async function loadDashboardStats() {
  try {
    const response = await fetch(`php/driver_api.php?action=getDashboardStats&driverId=${currentDriver.DriverID}`);
    const data = await response.json();
    
    if (data.success) {
      const stats = data.stats;
      document.getElementById('upcomingRidesCount').textContent = stats.upcomingRides;
      document.getElementById('completedRidesCount').textContent = stats.completedRides;
      document.getElementById('pendingBookingsCount').textContent = stats.pendingBookings;
      document.getElementById('totalEarnings').textContent = `₱${stats.totalEarnings.toLocaleString()}`;
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

// Handle publish ride
async function handlePublishRide(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  formData.append('action', 'publishRide');
  formData.append('driverId', currentDriver.DriverID);
  
  try {
    const response = await fetch('php/driver_api.php', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Ride published successfully!');
      e.target.reset();
      
      // Set date to today
      const dateInput = e.target.querySelector('[name="rideDate"]');
      dateInput.value = new Date().toISOString().split('T')[0];
      
      switchView('rides');
      loadDashboardStats();
    } else {
      alert('Failed to publish ride: ' + data.message);
    }
  } catch (error) {
    console.error('Error publishing ride:', error);
    alert('Failed to publish ride');
  }
}

// Load bookings
async function loadBookings(filter = 'pending') {
  try {
    const response = await fetch(`php/driver_api.php?action=getBookings&driverId=${currentDriver.DriverID}&filter=${filter}`);
    const data = await response.json();
    
    const container = document.getElementById('bookingsList');
    
    if (data.success && data.bookings.length > 0) {
      container.innerHTML = data.bookings.map(booking => `
        <div class="booking-card">
          <div class="booking-header">
            <div class="booking-title">Booking #${booking.BookingID}</div>
            <span class="status-badge ${booking.Status.toLowerCase()}">${booking.Status}</span>
          </div>
          
          <div class="booking-info">
            <div class="info-item">
              <div class="info-label">Passenger</div>
              <div class="info-value">${booking.PassengerName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Contact</div>
              <div class="info-value">${booking.PassengerPhone}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Destination</div>
              <div class="info-value">${booking.Destination}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Seats</div>
              <div class="info-value">${booking.SeatCount} seat(s)</div>
            </div>
            <div class="info-item">
              <div class="info-label">Fare</div>
              <div class="info-value">₱${parseFloat(booking.TotalFare).toLocaleString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date</div>
              <div class="info-value">${new Date(booking.RideDate).toLocaleDateString()}</div>
            </div>
          </div>
          
          <div class="booking-actions">
            <button class="btn-action btn-view" onclick="viewBookingDetails(${booking.BookingID})">View Details</button>
            ${booking.Status === 'Pending' ? `
              <button class="btn-action btn-accept" onclick="handleBookingAction(${booking.BookingID}, 'accept')">Accept</button>
              <button class="btn-action btn-decline" onclick="handleBookingAction(${booking.BookingID}, 'decline')">Decline</button>
            ` : ''}
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="no-data">No bookings found</p>';
    }
  } catch (error) {
    console.error('Error loading bookings:', error);
    document.getElementById('bookingsList').innerHTML = '<p class="no-data">Error loading bookings</p>';
  }
}

// Handle booking action (accept/decline)
async function handleBookingAction(bookingId, action) {
  const confirmMsg = action === 'accept' ? 'Accept this booking?' : 'Decline this booking?';
  if (!confirm(confirmMsg)) return;
  
  try {
    const formData = new FormData();
    formData.append('action', 'handleBooking');
    formData.append('bookingId', bookingId);
    formData.append('bookingAction', action);
    
    const response = await fetch('php/driver_api.php', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(`Booking ${action}ed successfully!`);
      loadBookings(currentBookingFilter);
      loadDashboardStats();
    } else {
      alert(`Failed to ${action} booking: ` + data.message);
    }
  } catch (error) {
    console.error(`Error ${action}ing booking:`, error);
    alert(`Failed to ${action} booking`);
  }
}

// Load rides
async function loadRides(filter = 'upcoming') {
  try {
    const response = await fetch(`php/driver_api.php?action=getRides&driverId=${currentDriver.DriverID}&filter=${filter}`);
    const data = await response.json();
    
    const container = document.getElementById('ridesList');
    
    if (data.success && data.rides.length > 0) {
      container.innerHTML = data.rides.map(ride => `
        <div class="ride-card">
          <div class="ride-header">
            <div class="ride-title">${ride.FromLocation} → ${ride.Destination}</div>
            <span class="status-badge ${ride.Status.toLowerCase()}">${ride.Status}</span>
          </div>
          
          <div class="ride-info">
            <div class="info-item">
              <div class="info-label">Date & Time</div>
              <div class="info-value">${new Date(ride.DateTime).toLocaleString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Fare</div>
              <div class="info-value">₱${parseFloat(ride.Fare).toLocaleString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Available Seats</div>
              <div class="info-value">${ride.AvailableSeats} / ${ride.TotalSeats}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Booked</div>
              <div class="info-value">${ride.TotalSeats - ride.AvailableSeats} passenger(s)</div>
            </div>
          </div>
          
          ${ride.Notes ? `<div class="ride-notes"><strong>Notes:</strong> ${ride.Notes}</div>` : ''}
          
          <div class="ride-actions">
            <button class="btn-action btn-view" onclick="viewRideDetails(${ride.RideID})">View Details</button>
            ${ride.Status === 'Upcoming' ? `
              <button class="btn-action btn-cancel" onclick="cancelRide(${ride.RideID})">Cancel Ride</button>
            ` : ''}
            ${ride.Status === 'Completed' && !ride.PassengerRated ? `
              <button class="btn-action btn-rate" onclick="ratePassenger(${ride.RideID})">Rate Passenger</button>
            ` : ''}
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="no-data">No rides found</p>';
    }
  } catch (error) {
    console.error('Error loading rides:', error);
    document.getElementById('ridesList').innerHTML = '<p class="no-data">Error loading rides</p>';
  }
}

// Cancel ride
async function cancelRide(rideId) {
  const reason = prompt('Please provide a reason for cancellation:');
  if (!reason || reason.trim() === '') {
    alert('Cancellation reason is required');
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('action', 'cancelRide');
    formData.append('rideId', rideId);
    formData.append('reason', reason);
    
    const response = await fetch('php/driver_api.php', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Ride cancelled successfully');
      loadRides(currentRideFilter);
      loadDashboardStats();
    } else {
      alert('Failed to cancel ride: ' + data.message);
    }
  } catch (error) {
    console.error('Error cancelling ride:', error);
    alert('Failed to cancel ride');
  }
}

// Load passengers
async function loadPassengers() {
  try {
    const response = await fetch(`php/driver_api.php?action=getPassengers&driverId=${currentDriver.DriverID}`);
    const data = await response.json();
    
    const container = document.getElementById('passengersList');
    
    if (data.success && data.passengers.length > 0) {
      container.innerHTML = data.passengers.map(passenger => {
        const initial = passenger.PassengerName.charAt(0).toUpperCase();
        return `
          <div class="passenger-card">
            <div class="passenger-avatar">${initial}</div>
            <div class="passenger-name">${passenger.PassengerName}</div>
            <div class="passenger-info">Phone: ${passenger.PassengerPhone}</div>
            <div class="passenger-info">Trips: ${passenger.TripCount}</div>
            ${passenger.Rating ? `
              <div class="passenger-rating">⭐ ${passenger.Rating.toFixed(1)}</div>
            ` : ''}
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '<p class="no-data">No passengers yet</p>';
    }
  } catch (error) {
    console.error('Error loading passengers:', error);
    document.getElementById('passengersList').innerHTML = '<p class="no-data">Error loading passengers</p>';
  }
}

// Load earnings
async function loadEarnings() {
  try {
    const response = await fetch(`php/driver_api.php?action=getEarnings&driverId=${currentDriver.DriverID}`);
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('totalEarningsAmount').textContent = `₱${data.earnings.total.toLocaleString()}`;
      document.getElementById('monthlyEarnings').textContent = `₱${data.earnings.monthly.toLocaleString()}`;
      document.getElementById('completedTrips').textContent = data.earnings.completedTrips;
      
      // Load transactions
      const container = document.getElementById('transactionsList');
      if (data.transactions && data.transactions.length > 0) {
        container.innerHTML = data.transactions.map(transaction => `
          <div class="transaction-item">
            <div class="transaction-info">
              <div class="transaction-desc">${transaction.Description}</div>
              <div class="transaction-date">${new Date(transaction.Date).toLocaleDateString()}</div>
            </div>
            <div class="transaction-amount">₱${parseFloat(transaction.Amount).toLocaleString()}</div>
          </div>
        `).join('');
      } else {
        container.innerHTML = '<p class="no-data">No transactions yet</p>';
      }
    }
  } catch (error) {
    console.error('Error loading earnings:', error);
  }
}

// Load notifications
async function loadNotifications() {
  try {
    const response = await fetch(`php/driver_api.php?action=getNotifications&driverId=${currentDriver.DriverID}`);
    const data = await response.json();
    
    if (data.success) {
      const badge = document.getElementById('notificationCount');
      const container = document.getElementById('notificationsList');
      
      if (data.notifications && data.notifications.length > 0) {
        badge.textContent = data.unreadCount;
        badge.style.display = data.unreadCount > 0 ? 'flex' : 'none';
        
        container.innerHTML = data.notifications.map(notif => `
          <div class="notification-item ${notif.IsRead ? '' : 'unread'}">
            <div class="notification-title">${notif.Title}</div>
            <div class="notification-text">${notif.Message}</div>
            <div class="notification-time">${new Date(notif.CreatedAt).toLocaleString()}</div>
          </div>
        `).join('');
      } else {
        badge.style.display = 'none';
        container.innerHTML = '<p class="no-data">No notifications</p>';
      }
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

// View booking details
function viewBookingDetails(bookingId) {
  // Implementation for viewing booking details in modal
  alert(`View booking details for ID: ${bookingId}`);
}

// View ride details
function viewRideDetails(rideId) {
  // Implementation for viewing ride details in modal
  alert(`View ride details for ID: ${rideId}`);
}

// Rate passenger
function ratePassenger(rideId) {
  const modal = document.getElementById('ratingModal');
  const content = document.getElementById('ratingModalContent');
  
  content.innerHTML = `
    <div style="text-align: center;">
      <p style="margin-bottom: 20px;">How was your experience with this passenger?</p>
      <div class="rating-stars" id="ratingStars">
        ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}">⭐</span>`).join('')}
      </div>
      <textarea id="ratingComment" placeholder="Add a comment (optional)" rows="4" style="width:100%; margin-top:20px; padding:10px; border-radius:8px; border:2px solid #e0e0e0;"></textarea>
      <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
        <button class="btn-cancel" onclick="closeRatingModal()">Cancel</button>
        <button class="btn-submit" onclick="submitRating(${rideId})">Submit Rating</button>
      </div>
    </div>
  `;
  
  // Setup star rating
  let selectedRating = 0;
  document.querySelectorAll('#ratingStars .star').forEach(star => {
    star.addEventListener('click', function() {
      selectedRating = parseInt(this.dataset.rating);
      document.querySelectorAll('#ratingStars .star').forEach((s, index) => {
        s.classList.toggle('active', index < selectedRating);
      });
    });
  });
  
  modal.classList.add('active');
}

// Submit rating
async function submitRating(rideId) {
  const stars = document.querySelectorAll('#ratingStars .star.active').length;
  const comment = document.getElementById('ratingComment').value;
  
  if (stars === 0) {
    alert('Please select a rating');
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('action', 'ratePassenger');
    formData.append('rideId', rideId);
    formData.append('rating', stars);
    formData.append('comment', comment);
    
    const response = await fetch('php/driver_api.php', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Rating submitted successfully!');
      closeRatingModal();
      loadRides(currentRideFilter);
    } else {
      alert('Failed to submit rating: ' + data.message);
    }
  } catch (error) {
    console.error('Error submitting rating:', error);
    alert('Failed to submit rating');
  }
}

// Close modals
function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('active');
}

function closeRideModal() {
  document.getElementById('rideModal').classList.remove('active');
}

function closeRatingModal() {
  document.getElementById('ratingModal').classList.remove('active');
}

// Refresh current view
function refreshCurrentView() {
  const activeView = document.querySelector('.view.active');
  if (!activeView) return;
  
  const viewId = activeView.id;
  switch(viewId) {
    case 'bookingsView':
      loadBookings(currentBookingFilter);
      break;
    case 'ridesView':
      loadRides(currentRideFilter);
      break;
    case 'passengersView':
      loadPassengers();
      break;
    case 'earningsView':
      loadEarnings();
      break;
  }
}

// Logout
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.removeItem('user');
    window.location.href = 'index.html';
  }
}
async function handlePublishRide(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = {
    driverId: currentDriver.DriverID,
    destination: formData.get('destination'),
    rideDate: formData.get('rideDate'),
    rideTime: formData.get('rideTime'),
    availableSeats: parseInt(formData.get('availableSeats')),
    pricePerSeat: parseFloat(formData.get('fare')),
    notes: formData.get('notes') || ''
  };
  
  try {
    const response = await fetch('php/publish_ride.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Ride published successfully!');
      e.target.reset();
      
      // Set date to today
      const dateInput = e.target.querySelector('[name="rideDate"]');
      dateInput.value = new Date().toISOString().split('T')[0];
      
      switchView('rides');
      loadDashboardStats();
    } else {
      alert('Failed to publish ride: ' + result.message);
    }
  } catch (error) {
    console.error('Error publishing ride:', error);
    alert('Failed to publish ride. Please check console for details.');
  }
}