
    // Set today's date as default
    document.getElementById('calendar').valueAsDate = new Date();

    function publishRide() {
      alert('Publish a ride functionality - coming soon!');
    }

    function showUserMenu() {
      const userEmail = 'user@example.com'; // This would come from session storage
      const menu = confirm(`Logged in as: ${userEmail}\n\nClick OK to logout`);
      if (menu) {
        alert('Logged out successfully!');
        // In actual implementation: window.location.href = 'index.html';
      }
    }

    function searchRides() {
      const fromLocation = document.getElementById('fromLocation').value;
      const goingTo = document.getElementById('goingTo').value;
      const calendar = document.getElementById('calendar').value;
      const passengerCount = document.getElementById('passengerCount').value;

      if (!goingTo || !passengerCount) {
        alert('Please fill in destination and passenger count');
        return;
      }

      console.log('Searching rides:', {
        from: fromLocation,
        to: goingTo,
        date: calendar,
        passengers: passengerCount
      });

      alert(`Searching for rides from ${fromLocation} to ${goingTo} on ${calendar} for ${passengerCount} passenger(s)`);
    }
