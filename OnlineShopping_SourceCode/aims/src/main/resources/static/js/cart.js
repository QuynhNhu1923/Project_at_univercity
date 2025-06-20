/* Thêm sản phẩm vào giỏ hàng */
async function addToCart() {
    const product = JSON.parse(sessionStorage.getItem('selectedProduct'));
    const quantity = parseInt(document.getElementById('product-quantity').value);
    if (!product || quantity <= 0 || quantity > product.stock) {
        alert('Invalid quantity.');
        return;
    }
    try {
        const response = await fetch(`http://localhost:8080/api/carts/${sessionId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ barcode: product.barcode, quantity })
        });
        if (!response.ok) throw new Error('Failed to add to cart.');
        const cartData = await response.json();
        cart = cartData.items;
        alert('Product added to cart.');
        navigateTo('/pages/customer/cart.html');
    } catch (error) {
        alert('Error adding to cart: ' + error.message);
    }
}

/* Tải giỏ hàng */
async function loadCart() {
    try {
        const response = await fetch(`http://localhost:8080/api/carts/${sessionId}`);
        if (!response.ok) throw new Error('Failed to fetch cart.');
        const cartData = await response.json();
        cart = cartData.items || [];
        const cartItems = document.querySelector('#cart-items tbody');
        cartItems.innerHTML = '';
        let total = 0;
        cart.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.productName}</td>
                <td><input type="number" value="${item.quantity}" min="1" onchange="updateCartItem('${item.barcode}', this.value)"></td>
                <td>${item.price} VND</td>
                <td class="${item.rushSupported ? 'rush-supported' : 'rush-unsupported'}">
                    ${item.rushSupported ? 'Supported' : 'Not Supported'}
                </td>
                <td><button onclick="removeCartItem('${item.barcode}')">Remove</button></td>
            `;
            cartItems.appendChild(row);
            total += item.price * item.quantity;
        });
        document.getElementById('cart-total').textContent = `${total} VND`;
    } catch (error) {
        alert('Error loading cart: ' + error.message);
    }
}

/* Cập nhật số lượng mục trong giỏ hàng */
async function updateCartItem(barcode, quantity) {
    if (quantity <= 0) {
        removeCartItem(barcode);
        return;
    }
    try {
        const response = await fetch(`http://localhost:8080/api/carts/${sessionId}/items/${barcode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: parseInt(quantity) })
        });
        if (!response.ok) throw new Error('Failed to update cart item.');
        const cartData = await response.json();
        cart = cartData.items;
        loadCart();
    } catch (error) {
        alert('Error updating cart item: ' + error.message);
    }
}

/* Xóa mục khỏi giỏ hàng */
async function removeCartItem(barcode) {
    try {
        const response = await fetch(`http://localhost:8080/api/carts/${sessionId}/items/${barcode}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to remove cart item.');
        const cartData = await response.json();
        cart = cartData.items;
        loadCart();
    } catch (error) {
        alert('Error removing cart item: ' + error.message);
    }
}

/* Kiểm tra kho và chuyển đến trang đặt hàng */
async function checkStockAndProceed() {
    try {
        const response = await fetch(`http://localhost:8080/api/carts/${sessionId}/check-stock`);
        if (!response.ok) throw new Error('Some products are out of stock.');
        const cartData = await response.json();
        if (cartData.items && cartData.items.length > 0) {
            navigateTo('/pages/customer/order.html');
        } else {
            alert('Cart is empty.');
        }
    } catch (error) {
        alert('Error checking cart: ' + error.message);
    }
}
