// Lấy sessionId từ localStorage hoặc tạo mới
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2);
    localStorage.setItem('sessionId', sessionId);
}

let cart = []; // Lưu giỏ hàng tạm thời

/* Thêm sản phẩm vào giỏ hàng */
async function addToCart() {
    const product = JSON.parse(sessionStorage.getItem('selectedProduct'));
    const quantity = parseInt(document.getElementById('product-quantity')?.value || 1);
    if (!product || quantity <= 0 || quantity > product.quantity) {
        alert('Invalid quantity.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/carts/${sessionId}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            },
            body: JSON.stringify({
                barcode: product.barcode,
                quantity: quantity
            })
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
        const response = await fetch(`http://localhost:8080/api/carts/${sessionId}`, {
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            }
        });
        if (!response.ok) throw new Error('Failed to fetch cart.');
        const cartData = await response.json();
        cart = cartData.items || [];

        const cartItems = document.querySelector('#cart-items tbody');
        cartItems.innerHTML = '';
        let total = 0;

        cart.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.title}</td>
                <td><input type="number" value="${item.quantity}" min="1" onchange="updateCartItem('${item.barcode}', this.value)"></td>
                <td>${item.price} VND</td>
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

/* Cập nhật số lượng sản phẩm trong giỏ hàng */
async function updateCartItem(barcode, quantity) {
    quantity = parseInt(quantity);
    if (quantity <= 0) {
        removeCartItem(barcode);
        return;
    }

    try {
        // Xóa item hiện tại
        await fetch(`http://localhost:8080/api/carts/${sessionId}/items/${barcode}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            }
        });
        // Thêm lại với số lượng mới
        await fetch(`http://localhost:8080/api/carts/${sessionId}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            },
            body: JSON.stringify({
                barcode: barcode,
                quantity: quantity
            })
        });

        await loadCart();
    } catch (error) {
        alert('Error updating cart item: ' + error.message);
    }
}

/* Xóa một sản phẩm khỏi giỏ hàng */
async function removeCartItem(barcode) {
    try {
        const response = await fetch(`http://localhost:8080/api/carts/${sessionId}/items/${barcode}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            }
        });
        if (!response.ok) throw new Error('Failed to remove cart item.');
        await loadCart();
    } catch (error) {
        alert('Error removing cart item: ' + error.message);
    }
}

/* Xóa toàn bộ giỏ hàng */
async function clearCart() {
    try {
        const response = await fetch(`http://localhost:8080/api/carts/clear/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            }
        });
        if (!response.ok) throw new Error('Failed to clear cart.');
        await loadCart();
    } catch (error) {
        alert('Error clearing cart: ' + error.message);
    }
}

/* Chuyển hướng sang trang đặt hàng nếu còn hàng */
async function checkStockAndProceed() {
    try {
        if (cart.length > 0) {
            navigateTo('/pages/customer/order.html');
        } else {
            alert('Cart is empty.');
        }
    } catch (error) {
        alert('Error checking cart: ' + error.message);
    }
}

// Khi trang cart.html load, gọi loadCart
document.addEventListener('DOMContentLoaded', loadCart);