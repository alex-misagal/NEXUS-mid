async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    const message = document.getElementById('message');

    console.log('Login response:', data);

    if (data.success) {
      message.style.color = 'green';
      message.textContent = `Welcome, ${data.user.Fname}!`;
      console.log('Redirecting to home.html...');
      setTimeout(() => {
        window.location.href = '/home.html';
      }, 1000);
    } else {
      message.style.color = 'red';
      message.textContent = data.message;
    }
  } catch (err) {
    console.error('Login error:', err);
    document.getElementById('message').textContent = 'Login failed. Please try again.';
  }
}

function openSignup() {
  document.getElementById('signupModal').style.display = 'block';
}

function closeSignup() {
  document.getElementById('signupModal').style.display = 'none';
}

async function submitSignup() {
  const Fname = document.getElementById('signupFname').value;
  const Lname = document.getElementById('signupLname').value;
  const Email = document.getElementById('signupEmail').value;
  const Password = document.getElementById('signupPassword').value;
  const PhoneNumber = document.getElementById('signupPhone').value;
  const msg = document.getElementById('signupMessage');

  if (!Fname || !Lname || !Email || !Password || !PhoneNumber) {
    msg.style.color = 'red';
    msg.textContent = 'Please fill in all fields.';
    return;
  }

  try {
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Fname, Lname, Email, Password, PhoneNumber })
    });

    const data = await res.json();
    console.log('🔥 Signup Response:', data);
    console.log('Success value:', data.success);

    if (data.success === true || data.success === 'true' || data.message === 'User registered successfully') {
      msg.style.color = 'green';
      msg.textContent = '✅ Account created successfully! Redirecting...';
      
      console.log('Signup successful, redirecting to home.html...');
      
      setTimeout(() => {
        console.log('Executing redirect now...');
        window.location.href = '/home.html';
      }, 1500);
    } else {
      msg.style.color = 'red';
      msg.textContent = data.message || 'Signup failed. Please try again.';
      console.log('Signup failed:', data);
    }
  } catch (err) {
    console.error('❌ Error submitting signup:', err);
    msg.style.color = 'red';
    msg.textContent = 'Failed to connect to server.';
  }
}

