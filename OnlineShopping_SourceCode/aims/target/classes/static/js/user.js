/* Thêm hoặc cập nhật người dùng */
async function addOrUpdateUser(event) {
    event.preventDefault();
    const userData = {
        email: document.getElementById('user-email').value,
        name: document.getElementById('user-name').value,
        roles: Array.from(document.getElementById('user-roles').selectedOptions).map(option => option.value)
    };
    try {
        const response = await fetch('http://localhost:8080/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error('Failed to add/update user.');
        await fetch('http://localhost:8080/api/users/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userData.email, action: 'updated' })
        });
        alert('User added/updated successfully.');
        document.getElementById('user-form').reset();
        loadUserList();
    } catch (error) {
        alert('Error adding/updating user: ' + error.message);
    }
}

/* Đặt lại mật khẩu người dùng */
async function resetPassword() {
    const email = document.getElementById('user-email').value;
    if (!email) {
        alert('Please enter an email.');
        return;
    }
    try {
        const response = await fetch(`http://localhost:8080/api/users/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!response.ok) throw new Error('Failed to reset password.');
        await fetch('http://localhost:8080/api/users/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, action: 'password_reset' })
        });
        alert('Password reset email sent.');
    } catch (error) {
        alert('Error resetting password: ' + error.message);
    }
}

/* Chặn người dùng */
async function blockUser(userId) {
    try {
        const userResponse = await fetch(`http://localhost:8080/api/users/${userId}`);
        const user = await userResponse.json();
        const response = await fetch(`http://localhost:8080/api/users/${userId}/block`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Failed to block user.');
        await fetch('http://localhost:8080/api/users/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, action: 'blocked' })
        });
        alert('User blocked.');
        loadUserList();
    } catch (error) {
        alert('Error blocking user: ' + error.message);
    }
}

/* Mở khóa người dùng */
async function unblockUser(userId) {
    try {
        const userResponse = await fetch(`http://localhost:8080/api/users/${userId}`);
        const user = await userResponse.json();
        const response = await fetch(`http://localhost:8080/api/users/${userId}/unblock`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Failed to unblock user.');
        await fetch('http://localhost:8080/api/users/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, action: 'unblocked' })
        });
        alert('User unblocked.');
        loadUserList();
    } catch (error) {
        alert('Error unblocking user: ' + error.message);
    }
}

/* Xóa người dùng */
async function deleteUser(userId) {
    try {
        const userResponse = await fetch(`http://localhost:8080/api/users/${userId}`);
        const user = await userResponse.json();
        const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete user.');
        await fetch('http://localhost:8080/api/users/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, action: 'deleted' })
        });
        alert('User deleted.');
        loadUserList();
    } catch (error) {
        alert('Error deleting user: ' + error.message);
    }
}

/* Tải danh sách người dùng */
async function loadUserList() {
    try {
        const response = await fetch('http://localhost:8080/api/users');
        if (!response.ok) throw new Error('Failed to fetch users.');
        const users = await response.json();
        const userList = document.querySelector('#user-list tbody');
        userList.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.email}</td>
                <td>${user.name}</td>
                <td>${user.roles.join(', ')}</td>
                <td>${user.status}</td>
                <td>
                    <button onclick="blockUser(${user.id})" ${user.status === 'BLOCKED' ? 'disabled' : ''}>Block</button>
                    <button onclick="unblockUser(${user.id})" ${user.status !== 'BLOCKED' ? 'disabled' : ''}>Unblock</button>
                    <button onclick="deleteUser(${user.id})">Delete</button>
                </td>
            `;
            userList.appendChild(row);
        });
    } catch (error) {
        alert('Error loading users: ' + error.message);
    }
}

/* Đổi mật khẩu admin */
async function changeAdminPassword(event) {
    event.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorElement = document.getElementById('password-error');
    errorElement.classList.add('hidden');
    if (newPassword !== confirmPassword) {
        errorElement.textContent = 'New password and confirmation do not match.';
        errorElement.classList.remove('hidden');
        return;
    }
    try {
        const response = await fetch('http://localhost:8080/api/users/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        if (!response.ok) throw new Error('Failed to change password.');
        await fetch('http://localhost:8080/api/users/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', action: 'password_changed' })
        });
        alert('Password changed successfully.');
        document.getElementById('change-password-form').reset();
        navigateTo('admin/customer-dashboard.html');
    } catch (error) {
        errorElement.textContent = 'Error changing password: ' + error.message;
        errorElement.classList.remove('hidden');
    }
}