
/* Xử lý đăng nhập */
async function handleLogin(event, role) {
  event.preventDefault();
  const email = document.getElementById(`${role}-login-email`).value;
  const password = document.getElementById(`${role}-login-password`).value;
  const errorElement = document.getElementById(`${role}-login-error`);
  errorElement.classList.add('hidden');
  errorElement.textContent = '';

  // Cho phép truy cập mà không cần đăng nhập (anonymous)
  if (!email || !password) {
    localStorage.setItem('role', 'anonymous');
    navigateTo('customer-dashboard.html'); // Hoặc bất kỳ trang mặc định nào
    return;
  }

  const result = await checkCredentials(email, password, role.toUpperCase());
  if (result.success) {
    let normalizedRole = result.role.toLowerCase();
    if (normalizedRole === 'product_manager' || normalizedRole === 'producmanager' || normalizedRole === 'productmanager') {
      normalizedRole = 'productmanager';
    } else if (normalizedRole === 'admin') {
      normalizedRole = 'admin';
    } else {
      errorElement.textContent = 'Vai trò không được hỗ trợ.';
      errorElement.classList.remove('hidden');
      return;
    }
    localStorage.setItem('token', result.token);
    localStorage.setItem('role', normalizedRole);
    if (normalizedRole == 'admin') navigateTo('admin-dashboard.html');
    if (normalizedRole == 'productmanager') navigateTo('manager-dashboard.html');
  } else {
    errorElement.textContent = result.message || 'Email hoặc mật khẩu không hợp lệ.';
    errorElement.classList.remove('hidden');
  }
}
/* Kiểm tra thông tin đăng nhập với API */
async function checkCredentials(email, password, role) {
  try {
    console.log('Sending role:', role);
    const response = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    const data = await response.json();
    console.log('API response:', data); // Log toàn bộ phản hồi
    console.log('Received role:', data.role); // Log role cụ thể
    if (response.ok && data.success === true) {
      return { success: true, token: data.token, role: data.role };
    }
    return { success: false, message: data.message || 'Email hoặc mật khẩu không hợp lệ.' };
  } catch (error) {
    return { success: false, message: 'Lỗi kết nối đến server.' };
  }
}
