// Định nghĩa biến toàn cục
let sessionId = null;
let cart = [];

function selectRole(role) {
    console.log('Selecting role:', role);
    if (typeof navigateTo === 'undefined') {
        console.error('navigateTo function is not defined! Ensure /js/navigation.js is loaded.');
        return;
    }
    if (role === 'customer') {
        navigateTo('/pages/customer/dashboard.html');
    } else if (role === 'productmanager') {
        navigateTo('/pages/productmanager/login.html');
    } else if (role === 'admin') {
        navigateTo('/pages/admin/login.html');
    }
}

function navigateTo(page) {
    const url = page.startsWith('/') ? page : '/' + page;
    console.log('Attempting to navigate to URL:', url);
    console.log('Current location:', window.location.href);
    // Kiểm tra nếu cần token JWT (tùy thuộc vào cấu hình)
    const token = localStorage.getItem('jwtToken'); // Giả định token được lưu trong localStorage
    if (token) {
        console.log('JWT Token found, adding to request:', token);
        // Thêm token vào header nếu cần (tùy thuộc vào backend)
        // Ví dụ: window.location.href = url + '?token=' + token;
    } else {
        console.log('No JWT Token found, proceeding without authentication.');
    }
    try {
        window.location.href = url;
        console.log('Navigation initiated to:', url);
    } catch (e) {
        console.error('Navigation failed:', e);
    }
}

function logout() {
    sessionId = Math.random().toString(36).substring(2);
    cart = [];
    navigateTo('/pages/role-selection.html');
}