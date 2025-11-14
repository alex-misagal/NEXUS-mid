async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('php/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();
    const message = document.getElementById('message');

    console.log('Login response:', data);

    if (data.success) {
      message.style.color = 'green';
      message.textContent = `Welcome, ${data.user.Fname}!`;

      console.log('Redirecting to home.html...');
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 1000);
    } else {
      message.style.color = 'red';
      message.textContent = data.message || 'Login failed.';
    }
  } catch (err) {
    console.error('Login error:', err);
    const message = document.getElementById('message');
    message.style.color = 'red';
    message.textContent = 'Login failed. Please try again.';
  }
}

function openSignup() {
  document.getElementById('signupModal').style.display = 'block';
}

function closeSignup() {
  document.getElementById('signupModal').style.display = 'none';
}

async function submitSignup() {
  const Fname = document.getElementById('signupFname').value.trim();
  const Lname = document.getElementById('signupLname').value.trim();
  const Email = document.getElementById('signupEmail').value.trim();
  const Password = document.getElementById('signupPassword').value;
  const PhoneNumber = document.getElementById('signupPhone').value.trim();
  const msg = document.getElementById('signupMessage');

  // Basic client-side validation
  if (!Fname || !Lname || !Email || !Password || !PhoneNumber) {
    msg.style.color = 'red';
    msg.textContent = 'Please fill in all fields.';
    return;
  }

  try {
    const res = await fetch('php/register.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Fname, Lname, Email, Password, PhoneNumber }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();

    console.log('Signup Response:', data);

    if (data.success) {
      msg.style.color = 'green';
      msg.textContent = '✅ Account created successfully! Redirecting...';

      setTimeout(() => {
        window.location.href = 'home.html';
      }, 1500);
    } else {
      msg.style.color = 'red';
      msg.textContent = data.message || 'Signup failed. Please try again.';
    }
  } catch (err) {
    console.error('Error submitting signup:', err);
    msg.style.color = 'red';
    msg.textContent = 'Failed to connect to server.';
  }
}

async function fetchUsers() {
  try {
    const res = await fetch('php/getusers.php');
    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();
    const list = document.getElementById('userList');
    list.innerHTML = '';

    if (data.success) {
      data.users.forEach((u) => {
        const li = document.createElement('li');
        li.textContent = `${u.Fname} ${u.Lname} (${u.Email})`;
        list.appendChild(li);
      });
    } else {
      list.innerHTML = '<li>No users found.</li>';
    }
  } catch (err) {
    alert('Error fetching users: ' + err);
  }
}

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const message = document.getElementById('message');
  message.style.color = 'black';
  message.textContent = 'Logging in...';

  if (!email || !password) {
    message.style.color = 'red';
    message.textContent = 'Please enter email and password.';
    return;
  }

  try {
    const res = await fetch('php/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();

    if (data.success) {
      message.style.color = 'green';
      message.textContent = `Welcome, ${data.user.Fname}! Redirecting...`;

      setTimeout(() => {
        window.location.href = 'home.html';  // Redirect after successful login
      }, 1500);
    } else {
      message.style.color = 'red';
      message.textContent = data.message || 'Login failed.';
    }
  } catch (error) {
    console.error('Login error:', error);
    message.style.color = 'red';
    message.textContent = 'An error occurred during login.';
  }
}
