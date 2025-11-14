document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');
  if (calendarEl && !calendarEl.value) {
    calendarEl.valueAsDate = new Date();
  }

  // NEW: Disable past dates
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
  if (userIcon) {
    userIcon.addEventListener('click', showUserMenu);
  }

  const searchForm = document.querySelector('.search-container');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      if (!searchRides()) {
        e.preventDefault();
      }
    });
  }
});

function publishRide() {
  alert('Publish a ride functionality - coming soon!');
}

function showUserMenu() {
  const user = getStoredUser();
  if (!user) {
    if (confirm('You are not logged in. Go to the login page?')) {
      window.location.href = 'index.html';
    }
    return;
  }
  const message = `Logged in as: ${user.Fname} ${user.Lname}\n(${user.Email})\n\nClick OK to logout`;
  if (confirm(message)) {
    sessionStorage.removeItem('user');
    alert('Logged out successfully!');
    window.location.href = 'index.html';
  }
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
    from: 'Msryheights',
    to: goingTo,
    date: document.getElementById('calendar')?.value,
    passengers: passengerCount
  });
  return true;
}