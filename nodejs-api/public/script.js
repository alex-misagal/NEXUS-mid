// RideKada API Dashboard JavaScript

const API_BASE_URL = 'http://localhost:3000';

// Check API status on page load
window.addEventListener('DOMContentLoaded', () => {
  checkAPIStatus();
});

// Check if API is online
async function checkAPIStatus() {
  const indicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (data.status === 'healthy') {
      indicator.classList.add('online');
      statusText.textContent = 'API Online';
    } else {
      indicator.classList.add('offline');
      statusText.textContent = 'API Offline';
    }
  } catch (error) {
    indicator.classList.add('offline');
    statusText.textContent = 'API Offline';
    console.error('API health check failed:', error);
  }
}

// Fetch data from API
async function fetchData(endpoint) {
  const resultsContainer = document.getElementById('resultsContainer');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const errorMessage = document.getElementById('errorMessage');
  const resultsTitle = document.getElementById('resultsTitle');
  const resultsCount = document.getElementById('resultsCount');
  const clearBtn = document.getElementById('clearBtn');

  // Show loading
  loadingSpinner.style.display = 'block';
  errorMessage.style.display = 'none';
  resultsContainer.innerHTML = '';
  clearBtn.style.display = 'none';

  try {
    const response = await fetch(`${API_BASE_URL}/api/${endpoint}`);
    const data = await response.json();

    loadingSpinner.style.display = 'none';

    if (data.success) {
      resultsTitle.textContent = `${capitalizeFirst(endpoint)} Data`;
      resultsCount.textContent = `${data.count} record(s)`;
      resultsCount.classList.add('results-count');
      clearBtn.style.display = 'inline-block';

      if (data.count === 0) {
        resultsContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <p>No ${endpoint} found</p>
          </div>
        `;
      } else {
        displayResults(data.data, endpoint);
      }
    } else {
      showError(data.message || 'Failed to fetch data');
    }
  } catch (error) {
    loadingSpinner.style.display = 'none';
    showError('Failed to connect to API. Make sure the server is running.');
    console.error('Fetch error:', error);
  }
}

// Search drivers by destination
async function searchDrivers() {
  const searchInput = document.getElementById('searchInput');
  const destination = searchInput.value.trim();

  if (!destination) {
    alert('Please enter a destination');
    return;
  }

  const resultsContainer = document.getElementById('resultsContainer');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const errorMessage = document.getElementById('errorMessage');
  const resultsTitle = document.getElementById('resultsTitle');
  const resultsCount = document.getElementById('resultsCount');
  const clearBtn = document.getElementById('clearBtn');

  loadingSpinner.style.display = 'block';
  errorMessage.style.display = 'none';
  resultsContainer.innerHTML = '';
  clearBtn.style.display = 'none';

  try {
    const response = await fetch(`${API_BASE_URL}/api/drivers/search/${encodeURIComponent(destination)}`);
    const data = await response.json();

    loadingSpinner.style.display = 'none';

    if (data.success) {
      resultsTitle.textContent = `Search Results: "${destination}"`;
      resultsCount.textContent = `${data.count} driver(s) found`;
      resultsCount.classList.add('results-count');
      clearBtn.style.display = 'inline-block';

      if (data.count === 0) {
        resultsContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>No drivers found going to "${destination}"</p>
            <p style="font-size: 14px; margin-top: 10px;">Try a different destination</p>
          </div>
        `;
      } else {
        displayResults(data.data, 'drivers');
      }
    } else {
      showError(data.message || 'Search failed');
    }
  } catch (error) {
    loadingSpinner.style.display = 'none';
    showError('Failed to search. Make sure the API is running.');
    console.error('Search error:', error);
  }
}

// Quick search with predefined destination
function quickSearch(destination) {
  document.getElementById('searchInput').value = destination;
  searchDrivers();
}

// Handle Enter key in search input
function handleSearchKeypress(event) {
  if (event.key === 'Enter') {
    searchDrivers();
  }
}

// Display results based on data type
function displayResults(data, type) {
  const resultsContainer = document.getElementById('resultsContainer');
  resultsContainer.innerHTML = '';

  data.forEach(item => {
    const card = createDataCard(item, type);
    resultsContainer.appendChild(card);
  });
}

// Create data card based on type
function createDataCard(item, type) {
  const card = document.createElement('div');
  card.className = 'data-card';

  switch(type) {
    case 'users':
      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">${item.Fname} ${item.Lname}</div>
          <div class="card-id">ID: ${item.UserID}</div>
        </div>
        <div class="card-body">
          <div class="card-field">
            <div class="field-label">Email</div>
            <div class="field-value">${item.Email}</div>
          </div>
          <div class="card-field">
            <div class="field-label">Phone Number</div>
            <div class="field-value">${item.PhoneNumber}</div>
          </div>
          <div class="card-field">
            <div class="field-label">Passenger Count</div>
            <div class="field-value">${item.PCount}</div>
          </div>
        </div>
      `;
      break;

    case 'drivers':
      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">🚗 ${item.Fname} ${item.Lname}</div>
          <div class="card-id">ID: ${item.DriverID}</div>
        </div>
        <div class="card-body">
          <div class="card-field">
            <div class="field-label">Email</div>
            <div class="field-value">${item.Email || 'N/A'}</div>
          </div>
          <div class="card-field">
            <div class="field-label">Phone Number</div>
            <div class="field-value">${item.PhoneNumber}</div>
          </div>
          <div class="card-field">
            <div class="field-label">Status</div>
            <div class="field-value">${item.Status}</div>
          </div>
          <div class="card-field">
            <div class="field-label">Destination</div>
            <div class="field-value">${item.Destination}</div>
          </div>
          <div class="card-field">
            <div class="field-label">Vehicle</div>
            <div class="field-value">${item.Color} ${item.Model}</div>
          </div>
          <div class="card-field">
            <div class="field-label">Plate Number</div>
            <div class="field-value">${item.PlateNumber}</div>
          </div>
          <div class="card-field">
            <div class="field-label">Capacity</div>
            <div class="field-value">${item.Capacity} seats</div>
          </div>
        </div>
      `;
      break;

    case 'vehicles':
      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">🚙 ${item.Color} ${item.Model}</div>
          <div class="card-id">ID: ${item.VehicleID}</div>
        </div>
        <div class="card-body">
          <div class="card-field">
            <div class="field-label">Plate Number</div>
            <div class="field-value">${item.PlateNumber}</div>
          </div>
          <div class="card-field">
            <div class="field-label">Model</div>
            <div class="field-value">${item.Model}</div>
          </div>
          <div class="card-field">
            <div class="field-label">Color</div>
            <div class="field-value">${item.Color}</div>
          </div>
          <div class="card-field">
            <div class="field-label">Capacity</div>
            <div class="field-value">${item.Capacity} passengers</div>
          </div>
        </div>
      `;
      break;

    case 'bookings':
      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">📋 Booking ${item.BookingID}</div>
          <div class="card-id">${item.Status}</div>
        </div>
        <div class="card-body">
          <div class="card-field">
            <div class="field-label">Payment Status</div>
            <div class="field-value">${item.PaymentStatus}</div>
          </div>
          <div class="card-field">
            <div class="field-label">Seat Count</div>
            <div class="field-value">${item.SeatCount}</div>
          </div>
          <div class="card-field">
            <div class="field-label">Total Fare</div>
            <div class="field-value">₱${parseFloat(item.TotalFare).toFixed(2)}</div>
          </div>
          <div class="card-field">
            <div class="field-label">Date & Time</div>
            <div class="field-value">${item.DateTime ? new Date(item.DateTime).toLocaleString() : 'N/A'}</div>
          </div>
        </div>
      `;
      break;
  }

  return card;
}

// Show error message
function showError(message) {
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

// Clear results
function clearResults() {
  const resultsContainer = document.getElementById('resultsContainer');
  const resultsTitle = document.getElementById('resultsTitle');
  const resultsCount = document.getElementById('resultsCount');
  const clearBtn = document.getElementById('clearBtn');
  const errorMessage = document.getElementById('errorMessage');
  const searchInput = document.getElementById('searchInput');

  resultsContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📡</div>
      <p>Select an endpoint or search for drivers to view data</p>
    </div>
  `;
  resultsTitle.textContent = 'API Response';
  resultsCount.textContent = '';
  resultsCount.classList.remove('results-count');
  clearBtn.style.display = 'none';
  errorMessage.style.display = 'none';
  searchInput.value = '';
}

// Utility function to capitalize first letter
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}