/* Biến toàn cục để quản lý trạng thái */
let currentPages = {
    products: 0,
    orders: 0,
    productManager: 0,
    pendingOrders: 0
};

// Khai báo sessionId duy nhất, ưu tiên lấy từ localStorage nếu đã có
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2);
    localStorage.setItem('sessionId', sessionId);
}

let cart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
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

    if (path.includes('dashboard.html')) {
        console.log('Initializing dashboard...');
        searchProducts(currentPage('products'), 'priceAsc', 'barcode', '');
    } else if (path.includes('cart.html')) {
        loadCart();
    } else if (path.includes('orders.html')) {
        loadCustomerOrders();
    } else if (path.includes('product-management.html')) {
        loadProductManagerList();
    } else if (path.includes('pending-orders.html')) {
        loadPendingOrders();
    } else if (path.includes('user-management.html')) {
        loadUserList();
    } else if (path.includes('product-detail.html')) {
        loadProductDetails();
    } else {
        console.log('No matching path found:', path);
    }
}

document.addEventListener('DOMContentLoaded', initApp);

// Hàm khởi tạo khi trang tải
document.addEventListener('DOMContentLoaded', () => {
    searchProducts(0, document.getElementById('sort-products').value || 'priceAsc',
        document.getElementById('search-attribute').value || 'title',
        document.getElementById('search-products').value || '');
    // Gắn sự kiện cho nút "Search"
    document.querySelector('button[onclick^="searchProducts"]')?.addEventListener('click', () => {
        searchProducts(0, document.getElementById('sort-products').value || 'priceAsc',
            document.getElementById('search-attribute').value || 'title',
            document.getElementById('search-products').value || '');
    });
});

function searchProducts(page = 0, sort = 'priceAsc', attribute = 'title', keyword = '') {
    updateCurrentPage('products', page);
    // Lấy giá trị từ input và attribute
    const searchInput = document.getElementById('search-products');
    const searchAttribute = document.getElementById('search-attribute');
    if (!searchInput || !searchAttribute) {
        console.warn('Search input or attribute dropdown not found! Loading all products as fallback.');
        keyword = '';
        attribute = 'title'; // Fallback attribute
    } else {
        keyword = searchInput.value.trim();
        attribute = searchAttribute.value;
    }
    // Xác định endpoint dựa trên attribute và keyword
    let url = `/api/products?page=${page}&sort=${sort}&barcode=&category=`;
    if (keyword && attribute) {
        if (attribute === 'title') {
            url = `/api/products/search?query=${encodeURIComponent(keyword)}&page=${page}&sort=${sort}`;
        } else if (attribute === 'barcode') {
            url = `/api/products?page=${page}&sort=${sort}&barcode=${encodeURIComponent(keyword)}`;
        } else if (attribute === 'category') {
            url = `/api/products?page=${page}&sort=${sort}&category=${encodeURIComponent(keyword)}`;
        }
    }
    console.log("Searching products: URL=", url, "Params:", { page, sort, attribute, keyword });
    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + (localStorage.getItem('token') || ''),
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) throw new Error(`Network error: ${response.status} - ${response.statusText}`);
            return response.json();
        })
        .then(data => {
            console.log("API Response:", data);
            const grid = document.getElementById('product-grid');
            if (!grid) throw new Error('Product grid element not found!');
            grid.innerHTML = '';
            if (data.content && data.content.length > 0) {
                data.content.forEach(product => {
                    const item = document.createElement('div');
                    item.className = 'product-item';
                    item.innerHTML = `
                        <div>Name: ${product.title || 'N/A'}</div>
                        <div>Type: ${product.category || 'N/A'}</div>
                        <div>Price: $${(product.price || 0).toFixed(2)}</div>
                        <div>Stock: ${product.quantity || '0'}</div>
                        <div>Rush Delivery: ${product.rush_delivery ? 'Yes' : 'No'}</div>
                        <button onclick="loadProductDetails('${product.barcode || ''}')">View</button>
                    `;
                    grid.appendChild(item);
                });
                updatePagination(data.page.totalPages, page);
            } else {
                grid.innerHTML = '<div>No products found</div>';
            }
        })
        .catch(error => {
            console.error("Error fetching products:", error);
            const grid = document.getElementById('product-grid');
            if (grid) grid.innerHTML = `<div>Error loading products: ${error.message}</div>`;
        });
}


/* Hàm cập nhật nút phân trang */
function updatePagination(totalPages, currentPage) {
    const prevButton = document.querySelector('.pagination button:first-child');
    const nextButton = document.querySelector('.pagination button:last-child');

    if (!prevButton || !nextButton) {
        console.error("Pagination buttons not found!");
        return;
    }
    prevButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage >= totalPages - 1;

    const sort = document.getElementById('sort-products')?.value || 'priceAsc';
    const keyword = document.getElementById('search-products')?.value || '';

    prevButton.onclick = () => searchProducts(currentPage - 1, sort, 'barcode', keyword);
    nextButton.onclick = () => searchProducts(currentPage + 1, sort, 'barcode', keyword);
}

/* Hàm tải chi tiết sản phẩm */
function loadProductDetails(barcode) {
    console.log("Loading product details for barcode:", barcode);
    fetch(`/api/products?barcode=${barcode}`, {
        headers: {
            'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
        }
    })
        .then(response => {
            if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const grid = document.getElementById('product-grid');
            if (!grid) return console.error("Product grid not found!");

            grid.innerHTML = '';
            if (data.content?.length > 0) {
                const product = data.content[0];
                const item = document.createElement('div');
                item.className = 'product-item';
                item.innerHTML = `
                    <div>Name: ${product.title || 'N/A'}</div>
                    <div>Type: ${product.category || 'N/A'}</div>
                    <div>Price: $${product.price?.toFixed(2) || '0.00'}</div>
                    <div>Stock: ${product.quantity || '0'}</div>
                    <div>Rush Delivery: ${product.rush_delivery ? 'Yes' : 'No'}</div>
                    <button onclick="initApp()">Back</button>
                `;
                grid.appendChild(item);
            } else {
                grid.innerHTML = '<div>Product not found</div>';
            }
            console.log("Product details loaded:", data);
        })
        .catch(error => {
            console.error("Error loading product details:", error);
            const grid = document.getElementById('product-grid');
            if (grid) grid.innerHTML = `<div>Error loading product details: ${error.message}</div>`;
        });
}

/* Hàm tải giỏ hàng */
function loadCart() {
    console.log("Loading cart...");
    fetch(`/api/carts/${sessionId}`)
        .then(response => response.json())
        .then(data => {
            const grid = document.getElementById('product-grid');
            grid.innerHTML = '';
            data.items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'product-item';
                itemDiv.innerHTML = `
                    <div>Name: ${item.title}</div>
                    <div>Type: ${item.category}</div>
                    <div>Price: $${item.price.toFixed(2)}</div>
                    <div>Stock: ${item.quantity}</div>
                    <div>Rush Delivery: N/A</div>
                    <button>Remove</button>
                `;
                grid.appendChild(itemDiv);
            });
            console.log("Cart loaded:", data);
        })
        .catch(error => console.error("Error loading cart:", error));
}

/* Các hàm còn lại giữ nguyên */
function loadCustomerOrders() {
    console.log("Loading customer orders...");
    const email = prompt("Enter customer email:");
    if (!email) return;

    fetch(`/api/orders?email=${email}`)
        .then(response => response.json())
        .then(data => {
            const grid = document.getElementById('product-grid');
            grid.innerHTML = '';
            data.forEach(order => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'product-item';
                itemDiv.innerHTML = `
                    <div>Order ID: ${order.order_id}</div>
                    <div>Customer: ${order.customer_name}</div>
                    <div>Total: $${order.total_amount.toFixed(2)}</div>
                    <div>Status: ${order.status}</div>
                    <div>Delivery: ${order.delivery_method}</div>
                    <button>View Details</button>
                `;
                grid.appendChild(itemDiv);
            });
            console.log("Orders loaded:", data);
        })
        .catch(error => console.error("Error loading orders:", error));
}

function loadProductManagerList() {
    console.log("Loading product manager list...");
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            const grid = document.getElementById('product-grid');
            grid.innerHTML = '';
            data.forEach(product => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'product-item';
                itemDiv.innerHTML = `
                    <div>Name: ${product.title}</div>
                    <div>Type: ${product.category}</div>
                    <div>Price: $${product.price.toFixed(2)}</div>
                    <div>Stock: ${product.quantity}</div>
                    <div>Rush Delivery: ${product.rush_delivery ? 'Yes' : 'No'}</div>
                    <button>Edit</button> <button>Delete</button>
                `;
                grid.appendChild(itemDiv);
            });
            console.log("Product manager list loaded:", data);
        })
        .catch(error => console.error("Error loading product list:", error));
}

function loadPendingOrders() {
    console.log("Loading pending orders...");
    fetch('/api/orders?status=pending')
        .then(response => response.json())
        .then(data => {
            const grid = document.getElementById('product-grid');
            grid.innerHTML = '';
            data.forEach(order => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'product-item';
                itemDiv.innerHTML = `
                    <div>Order ID: ${order.order_id}</div>
                    <div>Customer: ${order.customer_name}</div>
                    <div>Total: $${order.total_amount.toFixed(2)}</div>
                    <div>Status: ${order.status}</div>
                    <div>Delivery: ${order.delivery_method}</div>
                    <button>Approve</button> <button>Reject</button>
                `;
                grid.appendChild(itemDiv);
            });
            console.log("Pending orders loaded:", data);
        })
        .catch(error => console.error("Error loading pending orders:", error));
}

function loadUserList() {
    console.log("Loading user list...");
    fetch('/api/users')
        .then(response => response.json())
        .then(data => {
            const grid = document.getElementById('product-grid');
            grid.innerHTML = '';
            data.forEach(user => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'product-item';
                itemDiv.innerHTML = `
                    <div>Email: ${user.email}</div>
                    <div>Status: ${user.status}</div>
                    <div>Created: ${user.created_at}</div>
                    <div>Roles: ${user.roles.join(', ')}</div>
                    <button>Block</button> <button>Activate</button>
                `;
                grid.appendChild(itemDiv);
            });
            console.log("User list loaded:", data);
        })
        .catch(error => console.error("Error loading user list:", error));
}