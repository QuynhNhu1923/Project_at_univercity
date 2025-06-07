/* Xử lý đăng nhập */
async function handleLogin(event, role) {
    event.preventDefault();
    const email = document.getElementById(`${role}-login-email`).value;
    const password = document.getElementById(`${role}-login-password`).value;
    const errorElement = document.getElementById(`${role}-login-error`);
    errorElement.classList.add('hidden');
    errorElement.textContent = '';
    const result = await checkCredentials(email, password, role);
    if (result.success) {
        navigateTo(`${role}/dashboard.html`);
    } else {
        errorElement.textContent = result.message || 'Invalid email or password.';
        errorElement.classList.remove('hidden');
    }
}

/* Kiểm tra thông tin đăng nhập với API */
async function checkCredentials(email, password, role) {
    try {
        const response = await fetch('http://localhost:8080/api/auth/allow-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });
        const data = await response.json();
        if (response.ok && data.success === true) {
            return { success: true };
        }
        return { success: false, message: data.message || 'Invalid email or password.' };
    } catch (error) {
        return { success: false, message: 'Error connecting to server.' };
    }
}