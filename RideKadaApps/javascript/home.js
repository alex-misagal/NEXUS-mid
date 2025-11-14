document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');
  if (calendarEl && !calendarEl.value) {
    calendarEl.valueAsDate = new Date();
  }

  // Disable past dates
  const calendarInput = document.getElementById('calendar');
  if (calendarInput) {
    const today = new Date().toISOString().split('T')[0];
    calendarInput.setAttribute('min', today);
    if (!calendarInput.value || calendarInput.value < today) {
      calendarInput.value = today;
    }
  }

  const publishBtn = document.getElementById('publishBtn');
  if (publishBtn) {
    publishBtn.addEventListener('click', publishRide);
  }

  const userIcon = document.getElementById('userIcon');
  const dropdown = document.getElementById('profileDropdown');
  const logoutLink = document.getElementById('logoutLink');

  if (userIcon && dropdown) {
    userIcon.addEventListener('click', toggleDropdown);
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

  const searchForm = document.querySelector('.search-container');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      if (!searchRides()) {
        e.preventDefault();
      }
    });
  }
});

function toggleDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('profileDropdown');
  dropdown.classList.toggle('show');
}

function handleLogout() {
  const user = getStoredUser();
  if (user) {
    if (confirm(`Logout ${user.Fname} ${user.Lname}?`)) {
      sessionStorage.removeItem('user');
      alert('Logged out successfully!');
      window.location.href = 'index.html';
    }
  } else {
    if (confirm('You are not logged in. Go to login?')) {
      window.location.href = 'index.html';
    }
  }
}

function publishRide() {
  alert('Publish a ride functionality - coming soon!');
}

function getStoredUser() {
  try {
    const data = sessionStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to parse user from sessionStorage', e);
    return null;
  }
}

function searchRides() {
  const goingTo = document.getElementById('goingTo')?.value.trim() || '';
  const passengerCount = document.getElementById('passengerCount')?.value.trim() || '';
  if (!goingTo || !passengerCount) {
    alert('Please fill in destination and passenger count');
    return false;
  }
  console.log('Searching rides:', {
    from: 'Maryheights',
    to: goingTo,
    date: document.getElementById('calendar')?.value,
    passengers: passengerCount
  });
  return true;
}