// RideKada Admin - Dashboard Script

const API_URL = 'http://localhost:3001';
let currentView = 'dashboard';
let currentUserId = null;
let currentUserType = null;

// Check authentication on load
window.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  loadDashboardStats();
  loadLogs();
  
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
    'reports': 'reportsView'
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
      
      if (data.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px;">No users found</td></tr>';
        return;
      }
      
      tbody.innerHTML = data.users.map(user => `
        <tr>
          <td>${user.id}</td>
          <td>${user.Fname} ${user.Lname}</td>
          <td>${user.Email || 'N/A'}</td>
          <td>${user.UserType}</td>
          <td>${user.PhoneNumber}</td>
          <td><span class="status-badge ${user.Status.toLowerCase()}">${user.Status}</span></td>
          <td class="action-buttons">
            <button class="btn-action btn-view" onclick="viewUser(${user.id}, '${user.UserType}')">👁️ View</button>
            <button class="btn-action btn-edit" onclick="editUser(${user.id}, '${user.UserType}')">✏️ Edit</button>
            <button class="btn-action btn-delete" onclick="deleteUser(${user.id}, '${user.UserType}')">🗑️ Delete</button>
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
      
      if (type === 'Driver') {
        content.innerHTML = `
          <div class="modal-grid">
            <div class="modal-section">
              <h3>Driver Information</h3>
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
                <input type="text" value="${user.Capacity || 'N/A'} People" readonly>
              </div>
            </div>
          </div>
        `;
      } else {
        content.innerHTML = `
          <div class="modal-section">
            <h3>Passenger Information</h3>
            <div class="passenger-avatar">👤</div>
            <div class="modal-field">
              <label>Name</label>
              <input type="text" value="${user.Fname} ${user.Lname}" readonly>
            </div>
            <div class="modal-field">
              <label>Email</label>
              <input type="text" value="${user.Email}" readonly>
            </div>
            <div class="modal-field">
              <label>Phone</label>
              <input type="text" value="${user.PhoneNumber}" readonly>
            </div>
          </div>
        `;
      }
      
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
      const modal = document.getElementById('editModal');
      const formContent = document.getElementById('editFormContent');
      
      if (type === 'Driver') {
        formContent.innerHTML = `
          <div class="modal-field">
            <label>First Name</label>
            <input type="text" name="Fname" value="${user.Fname}" required>
          </div>
          <div class="modal-field">
            <label>Last Name</label>
            <input type="text" name="Lname" value="${user.Lname}" required>
          </div>
          <div class="modal-field">
            <label>Email</label>
            <input type="email" name="Email" value="${user.Email || ''}" required>
          </div>
          <div class="modal-field">
            <label>Phone Number</label>
            <input type="text" name="PhoneNumber" value="${user.PhoneNumber}" required>
          </div>
          <div class="modal-field">
            <label>Password (leave blank to keep current)</label>
            <input type="password" name="Password">
          </div>
          <hr style="margin: 20px 0;">
          <h4>Vehicle Information</h4>
          <div class="modal-field">
            <label>Plate Number</label>
            <input type="text" name="PlateNumber" value="${user.PlateNumber || ''}">
          </div>
          <div class="modal-field">
            <label>Model</label>
            <input type="text" name="Model" value="${user.Model || ''}">
          </div>
          <div class="modal-field">
            <label>Color</label>
            <input type="text" name="Color" value="${user.Color || ''}">
          </div>
          <div class="modal-field">
            <label>Capacity</label>
            <input type="number" name="Capacity" value="${user.Capacity || ''}">
          </div>
        `;
      } else {
        formContent.innerHTML = `
          <div class="modal-field">
            <label>First Name</label>
            <input type="text" name="Fname" value="${user.Fname}" required>
          </div>
          <div class="modal-field">
            <label>Last Name</label>
            <input type="text" name="Lname" value="${user.Lname}" required>
          </div>
          <div class="modal-field">
            <label>Email</label>
            <input type="email" name="Email" value="${user.Email}" required>
          </div>
          <div class="modal-field">
            <label>Phone Number</label>
            <input type="text" name="PhoneNumber" value="${user.PhoneNumber}" required>
          </div>
          <div class="modal-field">
            <label>Password (leave blank to keep current)</label>
            <input type="password" name="Password">
          </div>
        `;
      }
      
      modal.classList.add('active');
    }
  } catch (error) {
    console.error('Error loading user for edit:', error);
    alert('Failed to load user details');
  }
}

// Save edited user
document.getElementById('editUserForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  // Remove empty password
  if (!data.Password) {
    delete data.Password;
  }
  
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
    } else {
      alert('Failed to update user: ' + result.message);
    }
  } catch (error) {
    console.error('Error updating user:', error);
    alert('Failed to update user');
  }
});

// Delete user
async function deleteUser(id, type) {
  if (!confirm(`Are you sure you want to delete this ${type}?`)) {
    return;
  }
  
  try {
    const response = await fetch(
      `${API_URL}/api/admin/users/${type.toLowerCase()}/${id}`,
      {
        method: 'DELETE',
        credentials: 'include'
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      alert('User deleted successfully!');
      loadUsers();
    } else {
      alert('Failed to delete user: ' + data.message);
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Failed to delete user');
  }
}

// Load new/pending users
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
      
      // Set up accept/decline buttons
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

// Handle filter
function handleFilter(e) {
  // Remove active from all filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active to clicked button
  this.classList.add('active');
  
  const filter = this.dataset.type;
  
  if (currentView === 'full-list' || currentView === 'manage-users') {
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

// Close modals on outside click
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});