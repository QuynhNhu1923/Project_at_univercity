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
        searchProducts(currentPage('products'), 'priceAsc', 'title', '');
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

// Hàm tìm kiếm sản phẩm
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
                        <button onclick="addToCart('${product.barcode || ''}', ${product.quantity || 0})">Add to Cart</button>
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
    const attribute = document.getElementById('search-attribute')?.value || 'title';
    const keyword = document.getElementById('search-products')?.value || '';

    prevButton.onclick = () => searchProducts(currentPage - 1, sort, attribute, keyword);
    nextButton.onclick = () => searchProducts(currentPage + 1, sort, attribute, keyword);
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
                selectedProduct = product;
                const item = document.createElement('div');
                item.className = 'product-item';
                item.innerHTML = `
                    <div>Name: ${product.title || 'N/A'}</div>
                    <div>Type: ${product.category || 'N/A'}</div>
                    <div>Price: $${product.price?.toFixed(2) || '0.00'}</div>
                    <div>Stock: ${product.quantity || '0'}</div>
                    <div>Rush Delivery: ${product.rush_delivery ? 'Yes' : 'No'}</div>
                    <input type="number" id="product-quantity" min="1" max="${product.quantity}" value="1">
                    <button onclick="addToCartFromDetails()">Add to Cart</button>
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

/* Hàm thêm vào giỏ hàng từ chi tiết sản phẩm */
function addToCartFromDetails() {
    const quantity = parseInt(document.getElementById('product-quantity').value);
    if (!selectedProduct || quantity <= 0 || quantity > selectedProduct.quantity) {
        alert('Invalid quantity.');
        return;
    }
    addToCart(selectedProduct.barcode, quantity);
}

// Hàm lấy hoặc tạo sessionId từ cookie
function getSessionId() {
    const name = 'sessionId=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    // Tạo sessionId ngẫu nhiên nếu không có
    const newSessionId = 'guest_' + Math.random().toString(36).substr(2, 9);
    document.cookie = `sessionId=${newSessionId}; path=/; max-age=86400`; // Hết hạn sau 24 giờ
    return newSessionId;
}

// Hàm addToCart
async function addToCart(barcode, quantity) {
    const sessionId = getSessionId();
    const headers = {
        'Content-Type': 'application/json'
        // Không thêm Authorization
    };
    const body = { barcode, quantity };

    try {
        const response = await fetch(`/api/carts/${sessionId}/items?barcode=${barcode}&quantity=${quantity}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Failed to add to cart. Status: ${response.status}, Message: ${data.message || ''}`);
        }
        console.log('✅ Added to cart:', data);
    } catch (error) {
        console.error('❌ Failed to add to cart:', error);
        alert('Failed to add to cart');
    }
}

// Gán sự kiện cho nút
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
        const barcode = button.getAttribute('data-barcode');
        const quantity = 1; // Hoặc lấy từ input nếu có
        addToCart(barcode, quantity);
    });
});

/* Hàm cập nhật số lượng giỏ hàng trên giao diện */
async function updateCartCount() {
    try {
        const response = await fetch(`http://localhost:8080/api/carts/${sessionId}`, {
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            }
        });
        if (!response.ok) throw new Error('Failed to fetch cart.');
        const cartData = await response.json();
        const cartCount = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
        const cartButton = document.querySelector('button[onclick^="navigateTo(\'/pages/customer/cart.html\'"]');
        if (cartButton) {
            cartButton.textContent = `View Cart (${cartCount})`;
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

/* Hàm tải giỏ hàng */
function loadCart() {
    console.log("Loading cart...");
    fetch(`/api/carts/${sessionId}`, {
        headers: {
            'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
        }
    })
        .then(response => {
            if (!response.ok) throw new Error(`Network error: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const grid = document.getElementById('product-grid');
            grid.innerHTML = '';
            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'product-item';
                    itemDiv.innerHTML = `
                        <div>Name: ${item.productName || 'N/A'}</div>
                        <div>Type: ${item.category || 'N/A'}</div>
                        <div>Price: $${(item.price || 0).toFixed(2)}</div>
                        <div>Quantity: ${item.quantity}</div>
                        <div>Rush Delivery: ${item.rushSupported ? 'Supported' : 'Not Supported'}</div>
                        <button onclick="removeCartItem('${item.barcode}')">Remove</button>
                    `;
                    grid.appendChild(itemDiv);
                });
            } else {
                grid.innerHTML = '<div>Cart is empty</div>';
            }
            console.log("Cart loaded:", data);
            updateCartCount();
        })
        .catch(error => {
            console.error("Error loading cart:", error);
            const grid = document.getElementById('product-grid');
            if (grid) grid.innerHTML = `<div>Error loading cart: ${error.message}</div>`;
        });
}

/* Hàm xóa mục khỏi giỏ hàng */
async function removeCartItem(barcode) {
    try {
        const response = await fetch(`http://localhost:8080/api/carts/${sessionId}/items/${barcode}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            }
        });
        if (!response.ok) throw new Error('Failed to remove cart item.');
        const cartData = await response.json();
        loadCart();
    } catch (error) {
        alert('Error removing cart item: ' + error.message);
    }
}

/* Các hàm còn lại */
function loadCustomerOrders() {
    console.log("Loading customer orders...");
    const email = prompt("Enter customer email:");
    if (!email) return;

    fetch(`/api/orders?email=${email}`, {
        headers: {
            'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
        }
    })
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
    fetch('/api/products', {
        headers: {
            'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
        }
    })
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
    fetch('/api/orders?status=pending', {
        headers: {
            'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
        }
    })
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
    fetch('/api/users', {
        headers: {
            'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
        }
    })
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