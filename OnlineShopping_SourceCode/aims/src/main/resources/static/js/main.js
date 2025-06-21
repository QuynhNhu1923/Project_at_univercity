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
    sessionId = 'guest_' + Math.random().toString(36).substring(2);
    localStorage.setItem('sessionId', sessionId);
}

let selectedProduct = null;

/* Hàm điều hướng */
function navigateTo(path) {
    window.location.href = path;
}

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
        if (typeof loadCart === 'function') {
            loadCart();
        } else {
            console.error('loadCart function not found');
        }
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
    const searchInput = document.getElementById('search-products');
    const searchAttribute = document.getElementById('search-attribute');

    if (!searchInput || !searchAttribute) {
        console.warn('Search input or attribute dropdown not found! Loading all products as fallback.');
        keyword = '';
        attribute = 'title';
    } else {
        keyword = searchInput.value.trim();
        attribute = searchAttribute.value;
    }

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
            const grid = document.getElementById('product-grid');
            if (!grid) throw new Error('Product grid element not found!');
            grid.innerHTML = '';

            if (data.content && data.content.length > 0) {
                data.content.forEach(product => {
                    const item = document.createElement('div');
                    item.className = 'product-item';
                    item.innerHTML = `
                        <div><strong>${product.title || 'N/A'}</strong></div>
                        <div>Category: ${product.category || 'N/A'}</div>
                        <div>Price: ${(product.price || 0).toFixed(2)} VND</div>
                        <div>Stock: ${product.quantity || 0}</div>
                        <div>Rush Delivery: ${product.rushDelivery ? 'Yes' : 'No'}</div>
                        <input type="number" class="quantity-input" value="1" min="1" max="${product.quantity}">
                        <button class="add-to-cart-btn" data-barcode="${product.barcode}">Add to Cart</button>
                        <button class="view-btn" data-barcode="${product.barcode}">View</button>
                    `;
                    grid.appendChild(item);
                });

                document.querySelectorAll('.add-to-cart-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const container = button.closest('.product-item');
                        const quantityInput = container.querySelector('.quantity-input');
                        const quantity = parseInt(quantityInput.value);
                        const barcode = button.getAttribute('data-barcode');

                        if (!barcode || isNaN(quantity) || quantity <= 0) {
                            alert('Vui lòng nhập số lượng hợp lệ.');
                            return;
                        }

                        addToCart(barcode, quantity, button);
                    });
                });

                document.querySelectorAll('.view-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const barcode = button.getAttribute('data-barcode');
                        if (barcode) {
                            loadProductDetails(barcode);
                        }
                    });
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

// Hàm thêm sản phẩm vào giỏ hàng
function addToCart(barcode, quantity, button = null) {
    const sessionId = localStorage.getItem('sessionId') || generateSessionId();
    localStorage.setItem('sessionId', sessionId);

    console.log(`Adding to cart: barcode=${barcode}, quantity=${quantity}, sessionId=${sessionId}`);

    fetch(`/api/carts/${sessionId}/items`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
        },
        body: JSON.stringify({
            barcode,
            quantity
        })
    })
        .then(response => {
            console.log(`Add to cart response: ${response.status}`);
            if (!response.ok) throw new Error("Lỗi khi thêm vào giỏ hàng (có thể hết hàng).");
            return response.json();
        })
        .then(data => {
            console.log('Add to cart success:', data);
            if (button) {
                button.textContent = "✔ Added!";
                button.disabled = true;
                setTimeout(() => {
                    button.textContent = "Add to Cart";
                    button.disabled = false;
                }, 1500);
            }
            alert("✅ Sản phẩm đã được thêm vào giỏ hàng!");
            navigateTo('/pages/customer/cart.html');
        })
        .catch(err => {
            console.error('Add to cart error:', err);
            alert("❌ Thêm vào giỏ hàng thất bại: " + err.message);
        });
}

function generateSessionId() {
    return 'guest_' + Math.random().toString(36).substring(2);
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
                sessionStorage.setItem('selectedProduct', JSON.stringify(product));
                const item = document.createElement('div');
                item.className = 'product-item';
                item.innerHTML = `
                    <div>Name: ${product.title || 'N/A'}</div>
                    <div>Type: ${product.category || 'N/A'}</div>
                    <div>Price: ${(product.price || 0).toFixed(2)} VND</div>
                    <div>Stock: ${product.quantity || 0}</div>
                    <div>Rush Delivery: ${product.rushDelivery ? 'Yes' : 'No'}</div>
                    <input type="number" id="product-quantity" min="1" max="${product.quantity}" value="1">
                    <button onclick="addToCartFromDetails()">Add to Cart</button>
                    <button onclick="navigateTo('/pages/customer/dashboard.html')">Back</button>
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

/* Hàm cập nhật số lượng giỏ hàng trên giao diện */
async function updateCartCount() {
    try {
        const response = await fetch(`/api/carts/${sessionId}`, {
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
                    <div>Total: ${(order.total_amount || 0).toFixed(2)} VND</div>
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
                    <div>Price: ${(product.price || 0).toFixed(2)} VND</div>
                    <div>Stock: ${product.quantity}</div>
                    <div>Rush Delivery: ${product.rushDelivery ? 'Yes' : 'No'}</div>
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
                    <div>Total: ${(order.total_amount || 0).toFixed(2)} VND</div>
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