let cart = [];
const VAT = 0.1;
let token = null;
let userRole = null;
let sessionId = "SESSION_" + Date.now();
let currentPage = 0;
let totalPages = 0;

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        if (response.ok) {
            token = result.token;
            userRole = result.role;
            alert('Login successful.');
            document.getElementById('login').style.display = 'none';
            if (userRole === 'PRODUCT_MANAGER') {
                document.getElementById('manager').style.display = 'block';
            }
            await fetchCart();
        } else {
            alert(result.message || 'Login failed.');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Error logging in.');
    }
});

// Fetch cart from backend
async function fetchCart() {
    try {
        const response = await fetch(`http://localhost:8080/api/carts/${sessionId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const cartData = await response.json();
        cart = cartData.cartItems.map(item => ({
            barcode: item.product.barcode,
            title: item.product.title,
            price: item.product.price,
            quantity: item.quantity,
            availableQuantity: item.product.quantity
        }));
        updateCart();
    } catch (error) {
        console.error('Error fetching cart:', error);
    }
}

// Fetch products with pagination
async function fetchProducts(sort = '', page = 0) {
    try {
        const response = await fetch(`http://localhost:8080/api/products?page=${page}&sort=${sort}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        displayProducts(data.content);
        currentPage = data.number;
        totalPages = data.totalPages;
        updatePaginationControls();
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Search products with pagination
async function searchProducts() {
    const query = document.getElementById('searchInput').value;
    const sort = document.getElementById('sortSelect').value;
    try {
        const response = await fetch(`http://localhost:8080/api/products/search?query=${query}&page=${currentPage}&sort=${sort}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        displayProducts(data.content);
        currentPage = data.number;
        totalPages = data.totalPages;
        updatePaginationControls();
    } catch (error) {
        console.error('Error searching products:', error);
    }
}

// Display products
function displayProducts(products) {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
      <img src="https://via.placeholder.com/150" alt="${product.title}">
      <h3>${product.title}</h3>
      <p>Price: ${product.price} VND</p>
      <p>Category: ${product.category}</p>
      <button onclick="addToCart('${product.barcode}', '${product.title}', ${product.price}, ${product.quantity})">Add to Cart</button>
    `;
        productList.appendChild(productCard);
    });
}

// Update pagination controls
function updatePaginationControls() {
    const pagination = document.createElement('div');
    pagination.innerHTML = `
    <button onclick="fetchProducts('', ${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>Previous</button>
    <span>Page ${currentPage + 1} of ${totalPages}</span>
    <button onclick="fetchProducts('', ${currentPage + 1})" ${currentPage + 1 === totalPages ? 'disabled' : ''}>Next</button>
  `;
    const productList = document.getElementById('productList');
    productList.appendChild(pagination);
}

// Add to cart
async function addToCart(barcode, title, price, availableQuantity) {
    const existingItem = cart.find(item => item.barcode === barcode);
    let newQuantity = 1;

    if (existingItem) {
        newQuantity = existingItem.quantity + 1;
        if (newQuantity > availableQuantity) {
            alert(`Only ${availableQuantity} items available in stock.`);
            return;
        }
    } else {
        if (availableQuantity < 1) {
            alert('Product is out of stock.');
            return;
        }
    }

    try {
        const response = await fetch(`http://localhost:8080/api/carts/${sessionId}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({ barcode, quantity: 1 })
        });

        if (response.ok) {
            await fetchCart();
        } else {
            alert('Error adding to cart.');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Error adding to cart.');
    }
}

// Update cart display
function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    cartItems.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
      ${item.title} - ${item.quantity} x ${item.price} VND
      <button onclick="updateCartItem('${item.barcode}', ${item.quantity + 1})">+</button>
      <button onclick="updateCartItem('${item.barcode}', ${item.quantity - 1})">-</button>
    `;
        cartItems.appendChild(li);
        total += item.quantity * item.price;
    });
    cartTotal.textContent = total;
}

// Update cart item quantity
async function updateCartItem(barcode, newQuantity) {
    try {
        const response = await fetch(`http://localhost:8080/api/carts/${sessionId}/items/${barcode}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({ quantity: newQuantity })
        });

        if (response.ok) {
            await fetchCart();
        } else {
            alert('Error updating cart item.');
        }
    } catch (error) {
        console.error('Error updating cart item:', error);
        alert('Error updating cart item.');
    }
}

// Clear cart after placing order
async function clearCart() {
    try {
        await fetch(`http://localhost:8080/api/carts/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
        cart = [];
        updateCart();
    } catch (error) {
        console.error('Error clearing cart:', error);
    }
}

// Proceed to order
function proceedToOrder() {
    if (cart.length === 0) {
        alert('Cart is empty.');
        return;
    }
    document.getElementById('cart').style.display = 'none';
    document.getElementById('order').style.display = 'block';
    updateOrderSummary();
}

// Update order summary
function updateOrderSummary() {
    const rushOrder = document.getElementById('rushOrder');
    const rushDeliveryTime = document.getElementById('rushDeliveryTime');
    const deliveryInstructions = document.getElementById('deliveryInstructions');
    const deliveryFeeEl = document.getElementById('deliveryFee');
    const totalInclVATEl = document.getElementById('totalInclVAT');

    rushOrder.addEventListener('change', () => {
        rushDeliveryTime.style.display = rushOrder.checked ? 'block' : 'none';
        deliveryInstructions.style.display = rushOrder.checked ? 'block' : 'none';
        calculateDeliveryFee();
    });

    document.getElementById('address').addEventListener('input', calculateDeliveryFee);
    calculateDeliveryFee();
}

// Calculate delivery fee
function calculateDeliveryFee() {
    const address = document.getElementById('address').value;
    const province = document.getElementById('province').value;
    const rushOrder = document.getElementById('rushOrder').checked;
    let totalWeight = cart.reduce((sum, item) => sum + item.quantity * 0.5, 0);
    let deliveryFee = 0;

    if (rushOrder && province.toLowerCase().includes('hanoi')) {
        deliveryFee = cart.length * 10000;
    } else {
        if (province.toLowerCase().includes('hanoi') || province.toLowerCase().includes('ho chi minh')) {
            deliveryFee = totalWeight <= 3 ? 22000 : 22000 + Math.ceil((totalWeight - 3) / 0.5) * 2500;
        } else {
            deliveryFee = totalWeight <= 0.5 ? 30000 : 30000 + Math.ceil((totalWeight - 0.5) / 0.5) * 2500;
        }
        let totalExclVAT = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
        if (totalExclVAT > 100000 && !rushOrder) {
            deliveryFee = Math.min(deliveryFee, 25000);
        }
    }

    document.getElementById('deliveryFee').textContent = deliveryFee;
    let totalExclVAT = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    let totalInclVAT = totalExclVAT * (1 + VAT) + deliveryFee;
    document.getElementById('totalInclVAT').textContent = totalInclVAT.toFixed(2);
}

// Place order
document.getElementById('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderData = {
        customerName: document.getElementById('recipientName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        provinceCity: document.getElementById('province').value,
        deliveryAddress: document.getElementById('address').value,
        deliveryMethod: document.getElementById('rushOrder').checked ? 'rush' : 'standard',
        deliveryTime: document.getElementById('rushDeliveryTime').value,
        deliveryInstructions: document.getElementById('deliveryInstructions').value,
        items: cart,
        deliveryFee: parseFloat(document.getElementById('deliveryFee').textContent),
        totalAmount: parseFloat(document.getElementById('totalInclVAT').textContent)
    };

    try {
        const response = await fetch('http://localhost:8080/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(orderData)
        });
        const result = await response.json();
        if (response.ok) {
            await clearCart();
            window.location.href = result.paymentUrl;
        } else {
            alert(result.message || 'Error placing order.');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Error placing order.');
    }
});

// Add product
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (userRole !== 'PRODUCT_MANAGER') {
        alert('Access denied.');
        return;
    }
    const productData = {
        barcode: document.getElementById('productBarcode').value,
        title: document.getElementById('productTitle').value,
        category: document.getElementById('productCategory').value,
        value: parseFloat(document.getElementById('productValue').value),
        price: parseFloat(document.getElementById('productPrice').value),
        quantity: parseInt(document.getElementById('productQuantity').value),
        warehouseEntryDate: document.getElementById('productWarehouseEntryDate').value,
        dimensions: document.getElementById('productDimensions').value,
        weight: parseFloat(document.getElementById('productWeight').value),
        description: document.getElementById('productDescription').value,
        condition: document.getElementById('productCondition') ? document.getElementById('productCondition').value : 'new',
        authors: document.getElementById('productAuthors') ? document.getElementById('productAuthors').value : '',
        coverType: document.getElementById('productCoverType') ? document.getElementById('productCoverType').value : '',
        publisher: document.getElementById('productPublisher') ? document.getElementById('productPublisher').value : '',
        publicationDate: document.getElementById('productPublicationDate') ? document.getElementById('productPublicationDate').value : '',
        numPages: document.getElementById('productNumPages') ? parseInt(document.getElementById('productNumPages').value) : 0,
        language: document.getElementById('productLanguage') ? document.getElementById('productLanguage').value : '',
        genre: document.getElementById('productGenre') ? document.getElementById('productGenre').value : '',
        artists: document.getElementById('productArtists') ? document.getElementById('productArtists').value : '',
        recordLabel: document.getElementById('productRecordLabel') ? document.getElementById('productRecordLabel').value : '',
        tracklist: document.getElementById('productTracklist') ? document.getElementById('productTracklist').value : '',
        discType: document.getElementById('productDiscType') ? document.getElementById('productDiscType').value : '',
        director: document.getElementById('productDirector') ? document.getElementById('productDirector').value : '',
        runtime: document.getElementById('productRuntime') ? parseInt(document.getElementById('productRuntime').value) : 0,
        studio: document.getElementById('productStudio') ? document.getElementById('productStudio').value : '',
        subtitles: document.getElementById('productSubtitles') ? document.getElementById('productSubtitles').value : '',
        releaseDate: document.getElementById('productReleaseDate') ? document.getElementById('productReleaseDate').value : ''
    };

    try {
        const response = await fetch('http://localhost:8080/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });
        if (response.ok) {
            alert('Product added successfully.');
            document.getElementById('productForm').reset();
            fetchProducts();
        } else {
            alert('Error adding product.');
        }
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Error adding product.');
    }
});

// Delete product
async function deleteProduct() {
    if (userRole !== 'PRODUCT_MANAGER') {
        alert('Access denied.');
        return;
    }
    const barcode = document.getElementById('deleteProductId').value;
    try {
        const response = await fetch(`http://localhost:8080/api/products/${barcode}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            alert('Product deleted successfully.');
            fetchProducts();
        } else {
            alert('Error deleting product.');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product.');
    }
}

// View orders with pagination
async function viewOrders(page = 0) {
    try {
        const response = await fetch(`http://localhost:8080/api/orders?page=${page}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        displayOrders(data.content);
        currentPage = data.number;
        totalPages = data.totalPages;
        updateOrderPaginationControls();
        document.getElementById('orders').style.display = 'block';
        document.getElementById('cart').style.display = 'none';
        document.getElementById('order').style.display = 'none';
        document.getElementById('manager').style.display = 'none';
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

// Display orders
function displayOrders(orders) {
    const orderList = document.getElementById('orderList');
    orderList.innerHTML = '';
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.innerHTML = `
      <p>Order ID: ${order.orderId}</p>
      <p>Recipient: ${order.customerName}</p>
      <p>Total: ${order.totalAmount} VND</p>
      <p>Status: ${order.status}</p>
      ${userRole === 'PRODUCT_MANAGER' ? `
        <button onclick="approveOrder(${order.orderId})">Approve</button>
        <button onclick="rejectOrder(${order.orderId})">Reject</button>
      ` : ''}
      ${order.status === 'pending' && !userRole ? `
        <button onclick="cancelOrder(${order.orderId})">Cancel</button>
      ` : ''}
    `;
        orderList.appendChild(orderCard);
    });
}

// Update order pagination controls
function updateOrderPaginationControls() {
    const pagination = document.createElement('div');
    pagination.innerHTML = `
    <button onclick="viewOrders(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>Previous</button>
    <span>Page ${currentPage + 1} of ${totalPages}</span>
    <button onclick="viewOrders(${currentPage + 1})" ${currentPage + 1 === totalPages ? 'disabled' : ''}>Next</button>
  `;
    const orderList = document.getElementById('orderList');
    orderList.appendChild(pagination);
}

// Approve order
async function approveOrder(id) {
    if (userRole !== 'PRODUCT_MANAGER') {
        alert('Access denied.');
        return;
    }
    try {
        const response = await fetch(`http://localhost:8080/api/orders/${id}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            alert('Order approved.');
            viewOrders(currentPage);
        } else {
            alert('Error approving order.');
        }
    } catch (error) {
        console.error('Error approving order:', error);
        alert('Error approving order.');
    }
}

// Reject order
async function rejectOrder(id) {
    if (userRole !== 'PRODUCT_MANAGER') {
        alert('Access denied.');
        return;
    }
    try {
        const response = await fetch(`http://localhost:8080/api/orders/${id}/reject`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            alert('Order rejected.');
            viewOrders(currentPage);
        } else {
            alert('Error rejecting order.');
        }
    } catch (error) {
        console.error('Error rejecting order:', error);
        alert('Error rejecting order.');
    }
}

// Cancel order
async function cancelOrder(id) {
    try {
        const response = await fetch(`http://localhost:8080/api/orders/${id}/cancel`, {
            method: 'PUT',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (response.ok) {
            alert('Order cancelled.');
            viewOrders(currentPage);
        } else {
            alert('Error cancelling order.');
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Error cancelling order.');
    }
}

// Toggle views
function toggleLogin() {
    document.getElementById('login').style.display = document.getElementById('login').style.display === 'none' ? 'block' : 'none';
}

function toggleManagerView() {
    if (userRole !== 'PRODUCT_MANAGER') {
        alert('Access denied.');
        return;
    }
    document.getElementById('manager').style.display = document.getElementById('manager').style.display === 'none' ? 'block' : 'none';
}

// Initial fetch
fetchProducts();
fetchCart();