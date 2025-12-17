// RideKada Admin - Dashboard Script

const API_URL = 'http://10.135.140.82:3002';
let currentView = 'dashboard';
let currentUserId = null;
let currentUserType = null;
let usersChart = null;
let monthlyEarningsChart = null;

// Check authentication on load
window.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  loadDashboardStats();
  loadLogs();
  loadMonthlyEarnings();
  
  // Set up navigation
  document.querySelectorAll('.nav-item, .nav-subitem').forEach(item => {
    item.addEventListener('click', handleNavigation);
  });
  
  // Set up logout buttons
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('logoutBtnTop').addEventListener('click', logout);
  
  // Set up publish button
  document.getElementById('publishBtn').addEventListener('click', publishAnnouncement);
  
  // Set up filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', handleFilter);
  });
  
  // Set up search
  document.getElementById('searchUsers')?.addEventListener('input', handleSearch);
  document.getElementById('searchTransactions')?.addEventListener('input', handleTransactionSearch);
  
  // Set up tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', handleTabSwitch);
  });
});

// Check if user is authenticated
async function checkAuth() {
  try {
    const response = await fetch(`${API_URL}/api/admin/check-session`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!data.authenticated) {
      window.location.href = 'login.html';
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = 'login.html';
  }
}

// Logout
async function logout(e) {
  e.preventDefault();
  
  try {
    await fetch(`${API_URL}/api/admin/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = 'login.html';
  }
}

// Handle navigation
function handleNavigation(e) {
  e.preventDefault();
  
  const page = this.dataset.page;
  
  if (!page) return;
  
  // Update active state
  document.querySelectorAll('.nav-item, .nav-subitem').forEach(item => {
    item.classList.remove('active');
  });
  this.classList.add('active');
  
  // Update breadcrumb
  const breadcrumbText = this.querySelector('.nav-text')?.textContent || this.textContent;
  document.getElementById('breadcrumbText').textContent = breadcrumbText;
  
  // Show appropriate view
  showView(page);
}

// Show view
function showView(viewName) {
  currentView = viewName;
  
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  
  // Show selected view
  const viewMap = {
    'dashboard': 'dashboardView',
    'manage-users': 'fullListView',
    'full-list': 'fullListView',
    'new-users': 'newUsersView',
    'user-status': 'userStatusView',
    'update-user': 'fullListView',
    'reports': 'reportsView',
    'transactions': 'transactionsView'
  };
  
  const viewId = viewMap[viewName];
  if (viewId) {
    document.getElementById(viewId).classList.add('active');
    
    // Load data for view
    switch(viewName) {
      case 'full-list':
      case 'manage-users':
      case 'update-user':
        loadUsers();
        break;
      case 'new-users':
        loadNewUsers();
        break;
      case 'user-status':
        loadUserStatus();
        break;
      case 'reports':
        loadReports();
        break;
      case 'transactions':
        loadTransactionStats();
        loadPayments();
        loadRides();
        break;
    }
  }
}

// Load dashboard stats
async function loadDashboardStats() {
  try {
    const response = await fetch(`${API_URL}/api/admin/dashboard-stats`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const stats = data.stats;
      document.getElementById('activeDrivers').textContent = stats.activeDrivers;
      document.getElementById('registeredPassengers').textContent = stats.registeredPassengers;
      document.getElementById('totalEarnings').textContent = `₱${stats.totalEarnings.toLocaleString()}`;
      document.getElementById('announcements').textContent = stats.announcements;
      document.getElementById('totalUsers').textContent = stats.totalUsers;
      document.getElementById('availableRides').textContent = stats.availableRides;
      document.getElementById('totalExpenses').textContent = `₱${stats.totalExpenses.toLocaleString()}`;
      
      renderUsersChart(stats.activeDrivers, stats.registeredPassengers);
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

// Load logs
async function loadLogs() {
  try {
    const response = await fetch(`${API_URL}/api/admin/logs`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      // New drivers
      const driverLogsEl = document.getElementById('newDriverLogs');
      if (data.logs.newDrivers.length > 0) {
        driverLogsEl.innerHTML = data.logs.newDrivers.map(driver => `
          <div class="log-item">
            <strong>Name:</strong> ${driver.name}<br>
            <strong>Email:</strong> ${driver.Email}<br>
            <strong>Phone:</strong> ${driver.PhoneNumber}
          </div>
        `).join('');
      } else {
        driverLogsEl.innerHTML = '<p style="color:#999;">No new drivers</p>';
      }
      
      // New passengers
      const passengerLogsEl = document.getElementById('newPassengerLogs');
      if (data.logs.newPassengers.length > 0) {
        passengerLogsEl.innerHTML = data.logs.newPassengers.map(passenger => `
          <div class="log-item">
            <strong>Name:</strong> ${passenger.name}<br>
            <strong>Email:</strong> ${passenger.Email}<br>
            <strong>Phone:</strong> ${passenger.PhoneNumber}
          </div>
        `).join('');
      } else {
        passengerLogsEl.innerHTML = '<p style="color:#999;">No new passengers</p>';
      }
    }
  } catch (error) {
    console.error('Error loading logs:', error);
  }
}

// Publish announcement
async function publishAnnouncement() {
  const message = document.getElementById('announcementText').value.trim();
  
  if (!message) {
    alert('Please enter an announcement message');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/admin/announcement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ message })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Announcement published successfully!');
      document.getElementById('announcementText').value = '';
    } else {
      alert('Failed to publish announcement');
    }
  } catch (error) {
    console.error('Error publishing announcement:', error);
    alert('Failed to publish announcement');
  }
}

// Load users
async function loadUsers(filter = 'all') {
  try {
    let url = `${API_URL}/api/admin/users`;
    
    if (filter !== 'all') {
      url += `?userType=${filter.charAt(0).toUpperCase() + filter.slice(1)}`;
    }
    
    const response = await fetch(url, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const tbody = document.getElementById('usersTableBody');
      const table = document.querySelector('.data-table');
      const headerRow = table.querySelector('thead tr');
      
      const isPassengerOnly = filter === 'passenger';
      const isAdminOnly = filter === 'admin';

      // Hide Status header
      const statusHeader = headerRow.cells[5];
      if (statusHeader) {
        statusHeader.style.display = (isPassengerOnly || isAdminOnly) ? 'none' : '';
      }

      // Hide Status cells
      document.querySelectorAll('#usersTableBody td:nth-child(6)').forEach(cell => {
        cell.style.display = (isPassengerOnly || isAdminOnly) ? 'none' : '';
      });
      
      if (data.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px;">No users found</td></tr>';
        return;
      }
      
      tbody.innerHTML = data.users.map(user => `
        <tr>
          <td>${user.id}</td>
          <td>
            ${user.UserType === 'Admin' ? `<strong>${user.Fname}</strong> (Admin)` : `${user.Fname} ${user.Lname}`}
          </td>
          <td>${user.Email || 'N/A'}</td>
          <td><strong>${user.UserType}</strong></td>
          <td>${user.PhoneNumber || 'N/A'}</td>
          
          <td style="display: ${isPassengerOnly || isAdminOnly ? 'none' : ''}">
            ${user.UserType === 'Driver' 
              ? `<span class="status-badge ${user.Status.toLowerCase()}">${user.Status}</span>` 
              : '-'}
          </td>
          
          <td class="action-buttons">
            <button class="btn-action btn-view" onclick="viewUser(${user.id}, '${user.UserType}')">👁️ View</button>
            ${user.UserType !== 'Admin' ? `
              <button class="btn-action btn-edit" onclick="editUser(${user.id}, '${user.UserType}')">✏️ Edit</button>
              <button class="btn-action btn-delete" onclick="deleteUser(${user.id}, '${user.UserType}')">🗑️ Delete</button>
            ` : ''}
          </td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// View user details
async function viewUser(id, type) {
  currentUserId = id;
  currentUserType = type.toLowerCase();
  
  try {
    const response = await fetch(
      `${API_URL}/api/admin/users/${type.toLowerCase()}/${id}`,
      { credentials: 'include' }
    );
    
    const data = await response.json();
    
    if (data.success) {
      const user = data.user;
      const modal = document.getElementById('userModal');
      const content = document.getElementById('userModalContent');
      
      let html = `
        <div class="modal-grid">
          <div class="modal-section">
            <h3>${type} Information</h3>
            <div class="driver-avatar">👤</div>
            <div class="modal-field">
              <label>Name</label>
              <input type="text" value="${user.Fname} ${user.Lname}" readonly>
            </div>
            <div class="modal-field">
              <label>Email</label>
              <input type="text" value="${user.Email || 'N/A'}" readonly>
            </div>
            <div class="modal-field">
              <label>Phone</label>
              <input type="text" value="${user.PhoneNumber}" readonly>
            </div>
            <div class="modal-field">
              <label>Status</label>
              <input type="text" value="${user.Status}" readonly>
            </div>
          </div>
      `;
      
      if (type === 'Driver') {
        html += `
          <div class="modal-section">
            <h3>Vehicle Information</h3>
            <div class="modal-field">
              <label>Model</label>
              <input type="text" value="${user.Model || 'N/A'}" readonly>
            </div>
            <div class="modal-field">
              <label>Plate Number</label>
              <input type="text" value="${user.PlateNumber || 'N/A'}" readonly>
            </div>
            <div class="modal-field">
              <label>Color</label>
              <input type="text" value="${user.Color || 'N/A'}" readonly>
            </div>
            <div class="modal-field">
              <label>Capacity</label>
              <input type="text" value="${user.Capacity || 'N/A'}" readonly>
            </div>
          </div>
        `;
      }
      
      html += `</div>`;
      
      content.innerHTML = html;
      modal.classList.add('active');
    }
  } catch (error) {
    console.error('Error loading user details:', error);
    alert('Failed to load user details');
  }
}

// Edit user
async function editUser(id, type) {
  currentUserId = id;
  currentUserType = type.toLowerCase();
  
  try {
    const response = await fetch(
      `${API_URL}/api/admin/users/${type.toLowerCase()}/${id}`,
      { credentials: 'include' }
    );
    
    const data = await response.json();
    
    if (data.success) {
      const user = data.user;
      const formContent = document.getElementById('editFormContent');
      formContent.innerHTML = '';

      const createInputField = (labelText, name, value = '', type = 'text', required = false) => {
        const div = document.createElement('div');
        div.className = 'modal-field';

        const label = document.createElement('label');
        label.textContent = labelText;
        div.appendChild(label);

        const input = document.createElement('input');
        input.type = type;
        input.name = name;
        input.value = value || '';
        if (required) input.required = true;
        div.appendChild(input);

        return div;
      };

      const createSelectField = (labelText, name, options, selectedValue) => {
        const div = document.createElement('div');
        div.className = 'modal-field';

        const label = document.createElement('label');
        label.textContent = labelText;
        div.appendChild(label);

        const select = document.createElement('select');
        select.name = name;
        select.required = true;

        options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.label;
          if (opt.value === selectedValue) option.selected = true;
          select.appendChild(option);
        });

        div.appendChild(select);
        return div;
      };

      formContent.appendChild(createInputField('First Name', 'Fname', user.Fname, 'text', true));
      formContent.appendChild(createInputField('Last Name', 'Lname', user.Lname, 'text', true));
      formContent.appendChild(createInputField('Email', 'Email', user.Email || '', 'email'));
      formContent.appendChild(createInputField('Phone Number', 'PhoneNumber', user.PhoneNumber, 'tel', true));
      formContent.appendChild(createInputField('Password (leave blank to keep current)', 'Password', '', 'password'));

      if (type === 'Driver') {
        const statusOptions = [
          { value: 'Active', label: 'Active' },
          { value: 'Suspended', label: 'Suspended' },
          { value: 'Inactive', label: 'Inactive' },
          { value: 'Pending', label: 'Pending' },
          { value: 'Declined', label: 'Declined' }
        ];

        formContent.appendChild(createSelectField('Status', 'Status', statusOptions, user.Status));

        const vehicleHeader = document.createElement('h3');
        vehicleHeader.textContent = 'Vehicle Information';
        vehicleHeader.style.marginTop = '20px';
        formContent.appendChild(vehicleHeader);

        formContent.appendChild(createInputField('Plate Number', 'PlateNumber', user.PlateNumber || ''));
        formContent.appendChild(createInputField('Model', 'Model', user.Model || ''));
        formContent.appendChild(createInputField('Color', 'Color', user.Color || ''));
        formContent.appendChild(createInputField('Capacity', 'Capacity', user.Capacity || '', 'number'));
      }

      document.getElementById('editUserForm').onsubmit = handleEditSubmit;
      document.getElementById('editModal').classList.add('active');
    }
  } catch (error) {
    console.error('Error loading user for editing:', error);
    alert('Failed to load user details.');
  }
}

// Handle edit submit
async function handleEditSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  try {
    const response = await fetch(
      `${API_URL}/api/admin/users/${currentUserType}/${currentUserId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      alert('User updated successfully!');
      closeEditModal();
      loadUsers();
      loadDashboardStats();
      if (currentView === 'new-users') loadNewUsers();
    } else {
      alert('Failed to update user: ' + result.message);
    }
  } catch (error) {
    console.error('Error updating user:', error);
    alert('Failed to update user');
  }
}

// Delete user
async function deleteUser(id, type) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  
  try {
    const response = await fetch(`${API_URL}/api/admin/users/${type.toLowerCase()}/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('User deleted successfully!');
      loadUsers();
      loadDashboardStats();
    } else {
      alert('Failed to delete user');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Failed to delete user');
  }
}

// Load new users (pending)
async function loadNewUsers() {
  try {
    const response = await fetch(`${API_URL}/api/admin/new-users`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const tbody = document.getElementById('pendingUsersTableBody');
      
      if (data.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px;">No pending users</td></tr>';
        return;
      }
      
      tbody.innerHTML = data.users.map((user, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${user.Fname} ${user.Lname}</td>
          <td>${user.UserType}</td>
          <td>December ${new Date().getDate()}, 2025</td>
          <td>
            <button class="btn-action btn-view" onclick="viewPendingUser(${user.DriverID})">👁️ View</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading new users:', error);
  }
}

// View pending user
async function viewPendingUser(id) {
  currentUserId = id;
  
  try {
    const response = await fetch(
      `${API_URL}/api/admin/users/driver/${id}`,
      { credentials: 'include' }
    );
    
    const data = await response.json();
    
    if (data.success) {
      const user = data.user;
      const modal = document.getElementById('pendingUserModal');
      const content = document.getElementById('pendingUserContent');
      
      content.innerHTML = `
        <div class="modal-grid">
          <div class="modal-section">
            <h3>Driver</h3>
            <div class="driver-avatar">👤</div>
            <div class="modal-field">
              <label>Name</label>
              <input type="text" value="${user.Fname} ${user.Lname}" readonly>
            </div>
            <div class="modal-field">
              <label>Email</label>
              <input type="text" value="${user.Email || 'N/A'}" readonly>
            </div>
            <div class="modal-field">
              <label>Phone</label>
              <input type="text" value="${user.PhoneNumber}" readonly>
            </div>
            <div class="modal-field">
              <label>Date of Registration</label>
              <input type="text" value="December ${new Date().getDate()}, 2025" readonly>
            </div>
          </div>
          
          <div class="modal-section">
            <h3>Vehicle</h3>
            <div class="modal-field">
              <label>Model</label>
              <input type="text" value="${user.Model || 'N/A'}" readonly>
            </div>
            <div class="modal-field">
              <label>Plate Number</label>
              <input type="text" value="${user.PlateNumber || 'N/A'}" readonly>
            </div>
            <div class="modal-field">
              <label>Color</label>
              <input type="text" value="${user.Color || 'N/A'}" readonly>
            </div>
            <div class="modal-field">
              <label>Capacity</label>
              <input type="text" value="${user.Capacity || 'N/A'} People" readonly>
            </div>
          </div>
        </div>
      `;
      
      document.getElementById('acceptBtn').onclick = () => acceptDriver(id);
      document.getElementById('declineBtn').onclick = () => declineDriver(id);
      
      modal.classList.add('active');
    }
  } catch (error) {
    console.error('Error loading pending user:', error);
    alert('Failed to load user details');
  }
}

// Accept driver
async function acceptDriver(id) {
  try {
    const response = await fetch(`${API_URL}/api/admin/users/accept/${id}`, {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Driver accepted successfully!');
      closePendingModal();
      loadNewUsers();
      loadDashboardStats();
    } else {
      alert('Failed to accept driver');
    }
  } catch (error) {
    console.error('Error accepting driver:', error);
    alert('Failed to accept driver');
  }
}

// Decline driver
async function declineDriver(id) {
  if (!confirm('Are you sure you want to decline this driver?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/admin/users/decline/${id}`, {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Driver declined');
      closePendingModal();
      loadNewUsers();
    } else {
      alert('Failed to decline driver');
    }
  } catch (error) {
    console.error('Error declining driver:', error);
    alert('Failed to decline driver');
  }
}

// Load user status
async function loadUserStatus() {
  loadUsers();
  const tbody = document.getElementById('statusTableBody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';
}

// Load reports
async function loadReports() {
  try {
    const response = await fetch(`${API_URL}/api/admin/reports/users`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const grid = document.getElementById('reportsGrid');
      
      if (data.reports.length === 0) {
        grid.innerHTML = '<p style="text-align:center; padding:40px; grid-column:1/-1;">No reports found</p>';
        return;
      }
      
      grid.innerHTML = data.reports.map(report => `
        <div class="report-card">
          <div class="report-header">
            <div class="report-user">${report.userName}</div>
            <div class="report-type">${report.userType}</div>
          </div>
          <div class="report-complaint"><strong>Complaint:</strong> ${report.complaint}</div>
          <div class="report-details">${report.details}</div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading reports:', error);
  }
}

// ===== TRANSACTION HISTORY FUNCTIONS =====

// Load transaction stats
async function loadTransactionStats() {
  try {
    const response = await fetch(`${API_URL}/api/admin/transactions/stats`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('totalTransactions').textContent = data.stats.totalTransactions;
      document.getElementById('completedPayments').textContent = `₱${data.stats.completedPayments.toLocaleString()}`;
      document.getElementById('totalRides').textContent = data.stats.totalRides;
    }
  } catch (error) {
    console.error('Error loading transaction stats:', error);
  }
}

// Load payments
async function loadPayments(filter = 'all') {
  try {
    let url = `${API_URL}/api/admin/transactions/payments`;
    if (filter !== 'all') {
      url += `?method=${filter}`;
    }
    
    const response = await fetch(url, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const tbody = document.getElementById('paymentsTableBody');
      
      if (data.payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px;">No payments found</td></tr>';
        return;
      }
      
      tbody.innerHTML = data.payments.map(payment => `
        <tr>
          <td>${payment.PaymentID}</td>
          <td>${payment.BookingID || 'N/A'}</td>
          <td>₱${parseFloat(payment.Amount).toLocaleString()}</td>
          <td><span class="status-badge">${payment.PaymentMethod}</span></td>
          <td>${new Date(payment.PaymentDate).toLocaleString()}</td>
          <td><span class="status-badge ${payment.Status.toLowerCase()}">${payment.Status}</span></td>
          <td>
            <button class="btn-action btn-view" onclick="viewPaymentDetails(${payment.PaymentID})">👁️ View</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading payments:', error);
    document.getElementById('paymentsTableBody').innerHTML = 
      '<tr><td colspan="7" style="text-align:center; padding:40px; color:red;">Error loading payments</td></tr>';
  }
}

// Load rides
async function loadRides(filter = 'all') {
  try {
    let url = `${API_URL}/api/admin/transactions/rides`;
    if (filter !== 'all') {
      url += `?status=${filter}`;
    }
    
    const response = await fetch(url, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const tbody = document.getElementById('ridesTableBody');
      
      if (data.rides.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px;">No rides found</td></tr>';
        return;
      }
      
      tbody.innerHTML = data.rides.map(ride => `
        <tr>
          <td>${ride.RideID}</td>
          <td>${ride.DriverName || 'N/A'}</td>
          <td>${ride.PassengerName || 'N/A'}</td>
          <td>${new Date(ride.DateTime).toLocaleString()}</td>
          <td>₱${parseFloat(ride.Fare).toLocaleString()}</td>
          <td><span class="status-badge ${ride.Status.toLowerCase()}">${ride.Status}</span></td>
          <td>
            <button class="btn-action btn-view" onclick="viewRideDetails(${ride.RideID})">👁️ View</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading rides:', error);
    document.getElementById('ridesTableBody').innerHTML = 
      '<tr><td colspan="7" style="text-align:center; padding:40px; color:red;">Error loading rides</td></tr>';
  }
}

// View payment details
async function viewPaymentDetails(paymentId) {
  try {
    const response = await fetch(`${API_URL}/api/admin/transactions/payment/${paymentId}`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const payment = data.payment;
      const modal = document.getElementById('transactionModal');
      const content = document.getElementById('transactionModalContent');
      
      content.innerHTML = `
        <div class="modal-section">
          <h3>Payment Information</h3>
          <div class="modal-field">
            <label>Payment ID</label>
            <input type="text" value="${payment.PaymentID}" readonly>
          </div>
          <div class="modal-field">
            <label>Booking ID</label>
            <input type="text" value="${payment.BookingID || 'N/A'}" readonly>
          </div>
          <div class="modal-field">
            <label>Amount</label>
            <input type="text" value="₱${parseFloat(payment.Amount).toLocaleString()}" readonly>
          </div>
          <div class="modal-field">
            <label>Payment Method</label>
            <input type="text" value="${payment.PaymentMethod}" readonly>
          </div>
          <div class="modal-field">
            <label>Payment Date</label>
            <input type="text" value="${new Date(payment.PaymentDate).toLocaleString()}" readonly>
          </div>
          <div class="modal-field">
            <label>Status</label>
            <input type="text" value="${payment.Status}" readonly>
          </div>
        </div>
      `;
      
      modal.classList.add('active');
    }
  } catch (error) {
    console.error('Error loading payment details:', error);
    alert('Failed to load payment details');
  }
}

// View ride details
async function viewRideDetails(rideId) {
  try {
    const response = await fetch(`${API_URL}/api/admin/transactions/ride/${rideId}`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const ride = data.ride;
      const modal = document.getElementById('rideModal');
      const content = document.getElementById('rideModalContent');
      
      content.innerHTML = `
        <div class="modal-grid">
          <div class="modal-section">
            <h3>Ride Information</h3>
            <div class="modal-field">
              <label>Ride ID</label>
              <input type="text" value="${ride.RideID}" readonly>
            </div>
            <div class="modal-field">
              <label>Date & Time</label>
              <input type="text" value="${new Date(ride.DateTime).toLocaleString()}" readonly>
            </div>
            <div class="modal-field">
              <label>Fare</label>
              <input type="text" value="₱${parseFloat(ride.Fare).toLocaleString()}" readonly>
            </div>
            <div class="modal-field">
              <label>Status</label>
              <input type="text" value="${ride.Status}" readonly>
            </div>
          </div>
          
          <div class="modal-section">
            <h3>People Involved</h3>
            <div class="modal-field">
              <label>Driver</label>
              <input type="text" value="${ride.DriverName || 'N/A'}" readonly>
            </div>
            <div class="modal-field">
              <label>Driver Phone</label>
              <input type="text" value="${ride.DriverPhone || 'N/A'}" readonly>
            </div>
            <div class="modal-field">
              <label>Passenger</label>
              <input type="text" value="${ride.PassengerName || 'N/A'}" readonly>
            </div>
            <div class="modal-field">
              <label>Passenger Phone</label>
              <input type="text" value="${ride.PassengerPhone || 'N/A'}" readonly>
            </div>
          </div>
        </div>
      `;
      
      modal.classList.add('active');
    }
  } catch (error) {
    console.error('Error loading ride details:', error);
    alert('Failed to load ride details');
  }
}

// Handle tab switch
function handleTabSwitch(e) {
  const tabName = this.dataset.tab;
  
  // Update active tab button
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  this.classList.add('active');
  
  // Show corresponding tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  if (tabName === 'payments') {
    document.getElementById('paymentsTab').classList.add('active');
  } else if (tabName === 'rides') {
    document.getElementById('ridesTab').classList.add('active');
  }
}

// Handle transaction search
function handleTransactionSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  const activeTab = document.querySelector('.tab-content.active');
  const rows = activeTab.querySelectorAll('tbody tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

// Handle filter
function handleFilter(e) {
  const parentSection = e.target.closest('.view, .tab-content');
  const buttons = parentSection.querySelectorAll('.filter-btn');
  
  buttons.forEach(btn => {
    btn.classList.remove('active');
  });
  
  this.classList.add('active');
  
  const filter = this.dataset.filter || this.dataset.type;
  
  // Determine which view we're in
  if (currentView === 'transactions') {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    if (activeTab === 'payments') {
      loadPayments(filter);
    } else if (activeTab === 'rides') {
      loadRides(filter);
    }
  } else {
    loadUsers(filter);
  }
}

// Handle search
function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  const rows = document.querySelectorAll('#usersTableBody tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

// Modal controls
function closeUserModal() {
  document.getElementById('userModal').classList.remove('active');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
}

function closePendingModal() {
  document.getElementById('pendingUserModal').classList.remove('active');
}

function closeTransactionModal() {
  document.getElementById('transactionModal').classList.remove('active');
}

function closeRideModal() {
  document.getElementById('rideModal').classList.remove('active');
}

// Close modals on outside click
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});

// Render users chart
function renderUsersChart(drivers, passengers) {
  const ctx = document.getElementById('usersChart');

  if (usersChart) {
    usersChart.destroy();
  }

  usersChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Drivers', 'Passengers'],
      datasets: [{
        data: [drivers, passengers],
        backgroundColor: ['#ef4444', '#3b82f6'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: '#111827',
          titleFont: { size: 13 },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8
        }
      }
    }
  });
}

// Load monthly earnings
async function loadMonthlyEarnings() {
  try {
    const res = await fetch(`${API_URL}/api/admin/earnings/monthly`, {
      credentials: 'include'
    });

    const data = await res.json();

    if (!data.success || data.earnings.length === 0) {
      console.warn('No monthly earnings data');
      return;
    }

    renderMonthlyEarningsChart(data.earnings);
  } catch (err) {
    console.error('Failed to load monthly earnings', err);
  }
}

// Render monthly earnings chart
function renderMonthlyEarningsChart(data) {
  const canvas = document.getElementById('dailyEarningsChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  if (monthlyEarningsChart) {
    monthlyEarningsChart.destroy();
  }

  monthlyEarningsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.month),
      datasets: [{
        label: 'Monthly Earnings',
        data: data.map(d => d.total),
        tension: 0.4,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: {
          ticks: {
            callback: value => '₱' + value.toLocaleString()
          }
        }
      }
    }
  });
}