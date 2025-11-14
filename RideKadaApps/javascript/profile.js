let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    currentUser = getStoredUser();

    if (!currentUser) {
        alert('You must be logged in to view your profile.');
        window.location.href = 'index.html';
        return;
    }

    populateProfile(currentUser);

    // Edit Button
    document.getElementById('editProfileBtn').addEventListener('click', openEditModal);

  document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
    const confirm1 = confirm("⚠️ Delete your account FOREVER?");
    if (!confirm1) return;

    const confirm2 = confirm("ALL rides, data, everything — GONE. Still do it?");
    if (!confirm2) return;

    const text = prompt('Type "DELETE" to confirm:');
    if (text !== "DELETE") {
        alert("Cancelled.");
        return;
    }

    const status = document.createElement('div');
    status.textContent = "Deleting...";
    status.style = "margin: 15px 0; color: red; font-weight: bold;";
    document.querySelector('.profile-card').appendChild(status);

    try {
        const res = await fetch('php/delete_account.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ UserID: currentUser.UserID })
        });

        const textResponse = await res.text(); // Get raw response
        console.log("Raw response:", textResponse); // ← OPEN DEV TOOLS (F12)

        let data;
        try {
            data = JSON.parse(textResponse);
        } catch (e) {
            alert("Server returned invalid JSON. Check console.");
            console.error("Invalid JSON:", textResponse);
            return;
        }

        if (data.success) {
            alert("Account deleted.");
            sessionStorage.clear();
            window.location.href = 'index.html';
        } else {
            alert("Error: " + data.message);
        }
    } catch (err) {
        console.error(err);
        alert("Network error. Check internet or server.");
    } finally {
        status.remove();
    }
});
    // Edit Form Submit
    document.getElementById('editForm').addEventListener('submit', saveProfile);
});

// Fill profile fields
function populateProfile(user) {
    document.getElementById('avatarInitial').textContent = (user.Fname?.[0] || 'U').toUpperCase();
    const fullName = `${user.Fname || ''} ${user.Lname || ''}`.trim() || 'User';
    document.getElementById('userName').textContent = fullName;
    document.getElementById('fullName').textContent = fullName;
    document.getElementById('userEmail').textContent = user.Email || '—';
    document.getElementById('email').textContent     = user.Email || '—';
    document.getElementById('phone').textContent     = user.PhoneNumber || '—';
    document.getElementById('address').textContent   = user.Address || '—';

    const memberDate = user.createdAt ? new Date(user.createdAt) : new Date();
    document.getElementById('memberSince').textContent =
        memberDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

// Open Edit Modal + Pre-fill
function openEditModal() {
    document.getElementById('editFname').value    = currentUser.Fname || '';
    document.getElementById('editLname').value    = currentUser.Lname || '';
    document.getElementById('editEmail').value    = currentUser.Email || '';
    document.getElementById('editPhone').value    = currentUser.PhoneNumber || '';
    document.getElementById('editAddress').value  = currentUser.Address || '';
    document.getElementById('editModal').style.display = 'flex';
    document.getElementById('editMessage').textContent = '';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Save Profile
async function saveProfile(e) {
    e.preventDefault();
    const msg = document.getElementById('editMessage');
    msg.textContent = '';
    msg.style.color = 'black';

  
const updated = {
    UserID: parseInt(currentUser.UserID), 
    Fname: document.getElementById('editFname').value.trim(),
    Lname: document.getElementById('editLname').value.trim(),
    Email: document.getElementById('editEmail').value.trim(),
    PhoneNumber: document.getElementById('editPhone').value.trim(),
    Address: document.getElementById('editAddress').value.trim()
};

    if (!updated.Fname || !updated.Lname || !updated.Email || !updated.PhoneNumber) {
        msg.style.color = 'red';
        msg.textContent = 'Please fill all required fields.';
        return;
    }

    msg.textContent = 'Saving...';

    try {
        const res = await fetch('php/update_profile.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        const data = await res.json();

        if (data.success) {
            currentUser = data.user;
            sessionStorage.setItem('user', JSON.stringify(currentUser));
            populateProfile(currentUser);
            msg.style.color = 'green';
            msg.textContent = data.message;
            setTimeout(closeEditModal, 1200);
        } else {
            msg.style.color = 'red';
            msg.textContent = data.message;
        }
    } catch (e) {
        console.error(e);
        msg.style.color = 'red';
        msg.textContent = 'Server error.';
    }
}

function getStoredUser() {
    try {
        const data = sessionStorage.getItem('user');
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error(e);
        return null;
    }
}