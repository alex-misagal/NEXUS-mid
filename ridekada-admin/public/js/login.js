// RideKada Admin - Login Script

const API_URL = 'http://10.135.140.82:3002';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const messageEl = document.getElementById('loginMessage');
  
  messageEl.textContent = 'Logging in...';
  messageEl.className = 'message';
  messageEl.style.display = 'block';
  
  try {
    const response = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      messageEl.textContent = 'Login successful! Redirecting...';
      messageEl.className = 'message success';
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      messageEl.textContent = data.message || 'Login failed';
      messageEl.className = 'message error';
    }
  } catch (error) {
    console.error('Login error:', error);
    messageEl.textContent = 'Failed to connect to server. Make sure the admin panel is running.';
    messageEl.className = 'message error';
  }
});