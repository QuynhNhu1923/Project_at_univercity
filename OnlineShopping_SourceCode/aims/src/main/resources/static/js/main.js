/* Global state for pagination */
let currentPages = {
  products: 0,
  orders: 0,
  pendingOrders: 0
};

// Initialize sessionId
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
  sessionId = 'guest_' + Math.random().toString(36).substring(2);
  localStorage.setItem('sessionId', sessionId);
}

let selectedProduct = null;

const formatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND'
});

function formatCurrency(value) {
  return formatter.format(value || 0);
}

/* Navigation function */
function navigateTo(path) {
  console.log("Navigating to:", path);
  window.location.href = path;
}

/* Get current page */
function currentPage(key) {
  return currentPages[key] || 0;
}

/* Update current page */
function updateCurrentPage(key, page) {
  currentPages[key] = page;
}

/* Routing configuration */
const routes = {
  '/pages/customer/customer-dashboard.html': () => searchProducts(currentPage('products'), 'priceAsc', 'title', ''),
  '/pages/customer/cart.html': () => { if (typeof loadCart === 'function') loadCart(); else console.error('loadCart function not found'); },
  '/pages/customer/orders.html': loadCustomerOrders,
  '/pages/customer/pending-orders.html': loadPendingOrders,
  '/pages/admin/user-management.html': loadUserList,
  '/pages/customer/product-detail.html': () => console.log("Product detail page loaded")
};

function handleRoute() {
  const path = window.location.pathname;
  console.log('Current path:', path);
  const route = routes[path];
  if (route) {
    route();
  } else {
    console.warn('No matching path found:', path);
  }
}

document.addEventListener('DOMContentLoaded', handleRoute);
window.addEventListener('popstate', handleRoute);

/* Search products */
function searchProducts(page = 0, sort = 'priceAsc', attribute = 'title', keyword = '') {
  updateCurrentPage('products', page);

  // DOM tìm kiếm (nếu có)
  const searchInput = document.getElementById('search-products');
  const searchAttribute = document.getElementById('search-attribute');

  // Nếu có ô tìm kiếm trên trang, lấy giá trị từ người dùng
  if (searchInput && searchAttribute) {
    keyword = searchInput.value.trim();
    attribute = searchAttribute.value;
  }

  // Tạo URL mặc định
  let url = `/api/products?page=${page}&size=20&sort=${sort}`;

  // Nếu có từ khóa, xây dựng URL theo từng thuộc tính
  if (keyword && keyword !== '') {
    if (attribute === 'title') {
      url = `/api/products/search?query=${encodeURIComponent(keyword)}&page=${page}&size=20&sort=${sort}`;
    } else if (attribute === 'barcode') {
      url += `&barcode=${encodeURIComponent(keyword)}`;
    } else if (attribute === 'category') {
      url += `&category=${encodeURIComponent(keyword)}`;
    }
  }

  console.log("Fetching products with URL:", url);

  fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
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
            item.className = 'product-card';
            item.innerHTML = `
            <h3>${product.title || 'N/A'}</h3>
            <p>Category: ${product.category || 'N/A'}</p>
            <p>Price: ${formatCurrency(product.price)}</p>
            <p>Stock: ${product.quantity || 0}</p>
            <p>Rush Delivery: ${product.rush_delivery ? 'Yes' : 'No'}</p>
            <input type="number" class="quantity-input" value="1" min="1" max="${product.quantity || 0}" data-max="${product.quantity || 0}">
            <button class="add-to-cart-btn" data-barcode="${product.barcode}">Add to Cart</button>
            <button class="view-btn" data-barcode="${product.barcode}">View Detail</button>
          `;
            grid.appendChild(item);
          });

          document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', () => {
              const container = button.closest('.product-card');
              const quantityInput = container.querySelector('.quantity-input');
              const quantity = parseInt(quantityInput.value);
              const max = parseInt(quantityInput.getAttribute('data-max')) || 0;
              const barcode = button.getAttribute('data-barcode');
              if (!barcode || isNaN(quantity) || quantity <= 0 || quantity > max) {
                alert('Please enter a valid quantity within stock limits.');
                return;
              }
              addToCart(barcode, quantity, button);
            });
          });

          document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', () => {
              const barcode = button.getAttribute('data-barcode');
              if (barcode) loadProductDetails(barcode);
            });
          });

          updatePagination(data.totalPages, page);
        } else {
          grid.innerHTML = '<div>No products found.</div>';
        }
      })
      .catch(error => {
        console.error("Error fetching products:", error);
        const grid = document.getElementById('product-grid');
        if (grid) grid.innerHTML = `<div>Error loading products: ${error.message}. Please try again.</div>`;
      });
}


/* Add to cart */
function addToCart(barcode, quantity, button = null) {
  if (!barcode || typeof barcode !== 'string' || barcode.trim() === '') {
    console.error('Invalid barcode:', barcode);
    alert('Invalid barcode. Please try again.');
    return;
  }
  if (isNaN(quantity) || quantity <= 0) {
    console.error('Invalid quantity:', quantity);
    alert('Quantity must be a positive number.');
    return;
  }

  const sessionId = localStorage.getItem('sessionId') || generateSessionId();
  localStorage.setItem('sessionId', sessionId);

  console.log(`Attempting to add to cart: sessionId=${sessionId}, barcode=${barcode}, quantity=${quantity}`);

  fetch(`/api/carts/${sessionId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barcode: barcode, quantity: quantity })
  })
      .then(response => {
        console.log(`Response status: ${response.status} ${response.statusText}`);
        if (!response.ok) {
          return response.text().then(text => { throw new Error(text || `HTTP error! Status: ${response.status}`); });
        }
        return response.json();
      })
      .then(data => {
        console.log('Add to cart success:', data);
        if (button) {
          button.textContent = '✔ Added!';
          button.disabled = true;
          setTimeout(() => { button.textContent = 'Add to Cart'; button.disabled = false; }, 1500);
        }
        alert('✅ Product added to cart!');
        updateCartCount();
      })
      .catch(err => {
        console.error('Add to cart error:', err);
        alert('❌ Failed to add to cart: ' + err.message);
      });
}

function generateSessionId() {
  return 'guest_' + Math.random().toString(36).substring(2);
}

/* Update pagination */
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

/* Load product details */
function loadProductDetails(barcode) {
  console.log("Loading product details for barcode:", barcode);
  fetch(`/api/products?barcode=${encodeURIComponent(barcode)}`, {
    headers: { 'Content-Type': 'application/json' }
  })
      .then(response => {
        if (!response.ok) throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        return response.json();
      })
      .then(data => {
        console.log("Received product data:", JSON.stringify(data, null, 2));
        let product;
        if (data.content && data.content.length > 0) {
          product = data.content[0]; // Page<Product> format
        } else if (data.barcode) {
          product = data; // Map<String, Object> format
        } else {
          const grid = document.getElementById('product-grid');
          if (grid) grid.innerHTML = `<div>Product not found for barcode "${barcode}". Please check again.</div>`;
          console.log("Product not found for barcode:", barcode);
          return;
        }
        selectedProduct = product;
        sessionStorage.setItem('selectedProduct', JSON.stringify(product));
        console.log("Stored product in sessionStorage:", product);
        navigateTo('/pages/customer/product-detail.html');
      })
      .catch(error => {
        console.error("Error loading product details:", error);
        const grid = document.getElementById('product-grid');
        if (grid) grid.innerHTML = `<div>Error loading product details: ${error.message}. Please try again.</div>`;
      });
}

/* Add to cart from product details */
function addToCartFromDetails() {
  const quantityInput = document.getElementById('product-quantity');
  const quantity = parseInt(quantityInput.value);
  if (!selectedProduct || isNaN(quantity) || quantity <= 0 || (selectedProduct.quantity && quantity > selectedProduct.quantity)) {
    alert('Please enter a valid quantity within stock limits.');
    return;
  }
  addToCart(selectedProduct.barcode, quantity);
}

/* Update cart count on UI */
async function updateCartCount() {
  try {
    const response = await fetch(`/api/carts/${sessionId}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to load cart.');
    const cartData = await response.json();
    const cartCount = cartData.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const cartButton = document.querySelector('button[onclick^="navigateTo(\'/pages/customer/cart.html\'"]');
    if (cartButton) cartButton.textContent = `View Cart (${cartCount})`;
  } catch (error) {
    console.error('Error updating cart count:', error);
  }
}

/* Load customer orders */
function loadCustomerOrders() {
  console.log("Loading customer orders...");
  const email = prompt("Enter customer email:");
  if (!email) return;
  fetch(`/api/orders?email=${encodeURIComponent(email)}`, {
    headers: { 'Content-Type': 'application/json' }
  })
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load orders: ${response.status}`);
        return response.json();
      })
      .then(data => {
        const grid = document.getElementById('product-grid');
        grid.innerHTML = '';
        data.forEach(order => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'product-item';
          itemDiv.innerHTML = `
                    <div>Order ID: ${order.order_id}</div>
                    <div>Customer: ${order.customer_name}</div>
                    <div>Total: ${formatCurrency(order.total_amount)}</div>
                    <div>Status: ${order.status}</div>
                    <div>Delivery Method: ${order.delivery_method}</div>
                    <button>View Details</button>
                `;
          grid.appendChild(itemDiv);
        });
        console.log("Orders loaded:", data);
      })
      .catch(error => {
        console.error("Error loading orders:", error);
        alert('Error loading orders: ' + error.message);
      });
}

/* Load pending orders */
function loadPendingOrders() {
  console.log("Loading pending orders...");
  fetch('/api/orders?status=pending', {
    headers: { 'Content-Type': 'application/json' }
  })
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load pending orders: ${response.status}`);
        return response.json();
      })
      .then(data => {
        const grid = document.getElementById('product-grid');
        grid.innerHTML = '';
        data.forEach(order => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'product-item';
          itemDiv.innerHTML = `
                    <div>Order ID: ${order.order_id}</div>
                    <div>Customer: ${order.customer_name}</div>
                    <div>Total: ${formatCurrency(order.total_amount)}</div>
                    <div>Status: ${order.status}</div>
                    <div>Delivery Method: ${order.delivery_method}</div>
                    <button>Approve</button> <button>Reject</button>
                `;
          grid.appendChild(itemDiv);
        });
        console.log("Pending orders loaded:", data);
      })
      .catch(error => {
        console.error("Error loading pending orders:", error);
        alert('Error loading pending orders: ' + error.message);
      });
}

/* Load user list */
function loadUserList() {
  console.log("Loading user list...");
  fetch('/api/users', {
    headers: { 'Content-Type': 'application/json' }
  })
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load user list: ${response.status}`);
        return response.json();
      })
      .then(data => {
        const grid = document.getElementById('product-grid');
        grid.innerHTML = '';
        data.forEach(user => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'product-item';
          itemDiv.innerHTML = `
                    <div>Email: ${user.email}</div>
                    <div>Status: ${user.status}</div>
                    <div>Created At: ${user.created_at}</div>
                    <div>Roles: ${user.roles.join(', ')}</div>
                    <button>Lock</button> <button>Activate</button>
                `;
          grid.appendChild(itemDiv);
        });
        console.log("User list loaded:", data);
      })
      .catch(error => {
        console.error("Error loading user list:", error);
        alert('Error loading user list: ' + error.message);
      });
}