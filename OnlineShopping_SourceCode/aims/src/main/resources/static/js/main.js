/* Biến toàn cục để quản lý trạng thái */
let currentPages = {
    products: 0,
    orders: 0,
    productManager: 0,
    pendingOrders: 0
};
let sessionId = Math.random().toString(36).substring(2);
let cart = [];
let selectedProduct = null;

/* Lấy số trang hiện tại */
function currentPage(key) {
    return currentPages[key] || 0;
}

/* Cập nhật số trang */
function updateCurrentPage(key, page) {
    currentPages[key] = page;
}

/* Khởi tạo ứng dụng */
function initApp() {
    const path = window.location.pathname;
    console.log('Current path:', path);
    if (path.includes('/pages/customer/dashboard.html')) {
        searchProducts();
    } else if (path.includes('/pages/customer/cart.html')) {
        loadCart();
    } else if (path.includes('/pages/customer/orders.html')) {
        loadCustomerOrders();
    } else if (path.includes('/pages/productmanager/product-management.html')) {
        loadProductManagerList();
    } else if (path.includes('/pages/productmanager/pending-orders.html')) {
        loadPendingOrders();
    } else if (path.includes('/pages/admin/user-management.html')) {
        loadUserList();
    } else if (path.includes('/pages/customer/product-detail.html')) {
        loadProductDetails();
    }
}

// Chạy khi trang tải
document.addEventLcartsistener('DOMContentLoaded', initApp);

// Các hàm giả định (chưa triển khai, bạn cần thêm logic)
// Hàm tìm kiếm sản phẩm
function searchProducts() {
    console.log("Searching products...");
    const attribute = document.getElementById('search-attribute').value;
    const keyword = document.getElementById('search-products').value;
    const sort = document.getElementById('sort-products').value;

    fetch(`/api/products?attribute=${attribute}&keyword=${keyword}&sort=${sort}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('product-list').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = ''; // Xóa nội dung cũ
            data.forEach(product => {
                const row = tableBody.insertRow();
                row.insertCell(0).textContent = product.title;
                row.insertCell(1).textContent = product.category;
                row.insertCell(2).textContent = `$${product.price.toFixed(2)}`;
                row.insertCell(3).textContent = product.quantity;
                row.insertCell(4).textContent = product.rush_delivery ? 'Yes' : 'No';
                row.insertCell(5).innerHTML = '<button>View</button>'; // Thêm nút action
            });
            console.log("Products loaded:", data);
        })
        .catch(error => console.error("Error fetching products:", error));
}

// Hàm tải giỏ hàng
function loadCart() {
    console.log("Loading cart...");
    const sessionId = localStorage.getItem('sessionId') || Math.random().toString(36).substring(2); // Giả định session
    localStorage.setItem('sessionId', sessionId);

    fetch(`/api/carts/${sessionId}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('product-list').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';
            data.items.forEach(item => {
                const row = tableBody.insertRow();
                row.insertCell(0).textContent = item.title;
                row.insertCell(1).textContent = item.category;
                row.insertCell(2).textContent = `$${item.price.toFixed(2)}`;
                row.insertCell(3).textContent = item.quantity;
                row.insertCell(4).textContent = 'N/A'; // Rush delivery không áp dụng cho cart
                row.insertCell(5).innerHTML = '<button>Remove</button>';
            });
            console.log("Cart loaded:", data);
        })
        .catch(error => console.error("Error loading cart:", error));
}

// Hàm tải đơn hàng của khách
function loadCustomerOrders() {
    console.log("Loading customer orders...");
    const email = prompt("Enter customer email:"); // Giả định lấy email từ người dùng
    if (!email) return;

    fetch(`/api/orders?email=${email}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('product-list').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';
            data.forEach(order => {
                const row = tableBody.insertRow();
                row.insertCell(0).textContent = order.order_id;
                row.insertCell(1).textContent = order.customer_name;
                row.insertCell(2).textContent = order.total_amount.toFixed(2);
                row.insertCell(3).textContent = order.status;
                row.insertCell(4).textContent = order.delivery_method;
                row.insertCell(5).innerHTML = '<button>View Details</button>';
            });
            console.log("Orders loaded:", data);
        })
        .catch(error => console.error("Error loading orders:", error));
}

// Hàm tải danh sách sản phẩm cho Product Manager
function loadProductManagerList() {
    console.log("Loading product manager list...");
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('product-list').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';
            data.forEach(product => {
                const row = tableBody.insertRow();
                row.insertCell(0).textContent = product.title;
                row.insertCell(1).textContent = product.category;
                row.insertCell(2).textContent = `$${product.price.toFixed(2)}`;
                row.insertCell(3).textContent = product.quantity;
                row.insertCell(4).textContent = product.rush_delivery ? 'Yes' : 'No';
                row.insertCell(5).innerHTML = '<button>Edit</button> <button>Delete</button>';
            });
            console.log("Product manager list loaded:", data);
        })
        .catch(error => console.error("Error loading product list:", error));
}

// Hàm tải danh sách đơn hàng đang chờ
function loadPendingOrders() {
    console.log("Loading pending orders...");
    fetch('/api/orders?status=pending')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('product-list').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';
            data.forEach(order => {
                const row = tableBody.insertRow();
                row.insertCell(0).textContent = order.order_id;
                row.insertCell(1).textContent = order.customer_name;
                row.insertCell(2).textContent = order.total_amount.toFixed(2);
                row.insertCell(3).textContent = order.status;
                row.insertCell(4).textContent = order.delivery_method;
                row.insertCell(5).innerHTML = '<button>Approve</button> <button>Reject</button>';
            });
            console.log("Pending orders loaded:", data);
        })
        .catch(error => console.error("Error loading pending orders:", error));
}

// Hàm tải danh sách người dùng
function loadUserList() {
    console.log("Loading user list...");
    fetch('/api/users')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('product-list').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';
            data.forEach(user => {
                const row = tableBody.insertRow();
                row.insertCell(0).textContent = user.email;
                row.insertCell(1).textContent = user.status;
                row.insertCell(2).textContent = user.created_at;
                row.insertCell(3).textContent = user.roles.join(', '); // Giả định roles là mảng
                row.insertCell(4).innerHTML = '<button>Block</button> <button>Activate</button>';
            });
            console.log("User list loaded:", data);
        })
        .catch(error => console.error("Error loading user list:", error));
}

// Hàm tải chi tiết sản phẩm
function loadProductDetails() {
    console.log("Loading product details...");
    const barcode = prompt("Enter product barcode:"); // Giả định lấy barcode từ người dùng
    if (!barcode) return;

    fetch(`/api/products/${barcode}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('product-list').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = data.title;
            row.insertCell(1).textContent = data.category;
            row.insertCell(2).textContent = `$${data.price.toFixed(2)}`;
            row.insertCell(3).textContent = data.quantity;
            row.insertCell(4).textContent = data.rush_delivery ? 'Yes' : 'No';
            row.insertCell(5).innerHTML = '<button>Back</button>';
            console.log("Product details loaded:", data);
        })
        .catch(error => console.error("Error loading product details:", error));
}