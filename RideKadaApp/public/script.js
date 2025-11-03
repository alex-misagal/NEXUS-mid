
async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  const message = document.getElementById('message');

  if (data.success) {
    message.style.color = 'green';
    message.textContent = `Welcome, ${data.user.Fname}!`;
  } else {
    message.style.color = 'red';
    message.textContent = data.message;
  }
}

// Popup controls
function openSignup() {
  document.getElementById('signupModal').style.display = 'block';
}

function closeSignup() {
  document.getElementById('signupModal').style.display = 'none';
}

// Register new user
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
    console.log('📥 Response:', data);

    if (data.success) {
      msg.style.color = 'green';
      msg.textContent = '✅ Account created successfully!';
      setTimeout(() => {
        msg.textContent = '';
        closeSignup();
      }, 2000);
    } else {
      msg.style.color = 'red';
      msg.textContent = data.message;
    }
  } catch (err) {
    console.error('❌ Error submitting signup:', err);
    msg.style.color = 'red';
    msg.textContent = 'Failed to connect to server.';
  }
}

