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
    showUser(data.user); 

    // ✅ Store user info in localStorage to use later in home.html
    localStorage.setItem('user', JSON.stringify(data.user));

    // ✅ Redirect to home.html after 1.5 seconds
    setTimeout(() => {
      window.location.href = 'home.html';
    }, 1500);
  } else {
    message.style.color = 'red';
    message.textContent = data.message;
  }
}

function signup() {
  alert("Signup function can be added here.");
}
