/* ============== LOGIN ============== */
async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const message = document.getElementById('message');

    if (!email || !password) {
        message.style.color = 'red';
        message.textContent = 'Please enter email and password.';
        return;
    }

    message.style.color = 'black';
    message.textContent = 'Logging in...';

    try {
        const res = await fetch('php/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
            sessionStorage.setItem('user', JSON.stringify(data.user));
            message.style.color = 'green';
            message.textContent = `Welcome, ${data.user.Fname}! Redirecting...`;
            setTimeout(() => location.href = 'home.html', 1500);
        } else {
            message.style.color = 'red';
            message.textContent = data.message || 'Login failed.';
        }
    } catch (e) {
        console.error(e);
        message.style.color = 'red';
        message.textContent = 'Server error.';
    }
}

/* ============== SIGNUP MODAL ============== */
function openSignup() {
    document.getElementById('signupModal').style.display = 'block';
}
function closeSignup() {
    document.getElementById('signupModal').style.display = 'none';
}

/* ============== SUBMIT SIGNUP ============== */
async function submitSignup() {
    const Fname       = document.getElementById('signupFname').value.trim();
    const Lname       = document.getElementById('signupLname').value.trim();
    const Email       = document.getElementById('signupEmail').value.trim();
    const Password    = document.getElementById('signupPassword').value;
    const PhoneNumber = document.getElementById('signupPhone').value.trim();
    const msg         = document.getElementById('signupMessage');

    if (!Fname || !Lname || !Email || !Password || !PhoneNumber) {
        msg.style.color = 'red';
        msg.textContent = 'Please fill in all fields.';
        return;
    }

    try {
        const res = await fetch('php/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Fname, Lname, Email, Password, PhoneNumber })
        });
        const data = await res.json();

        if (data.success) {
            sessionStorage.setItem('user', JSON.stringify(data.user));
            msg.style.color = 'green';
            msg.textContent = 'Account created! Redirecting...';
            setTimeout(() => location.href = 'home.html', 1500);
        } else {
            msg.style.color = 'red';
            msg.textContent = data.message || 'Signup failed.';
        }
    } catch (e) {
        console.error(e);
        msg.style.color = 'red';
        msg.textContent = 'Server error.';
    }
}