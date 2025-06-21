let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substring(7);
    localStorage.setItem('sessionId', sessionId);
}

let cart = [];

async function loadCart() {
    try {
        console.log(`Fetching cart for sessionId: ${sessionId}`);
        const response = await fetch(`/api/carts/${sessionId}`, {
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || ''),
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error(`Failed to fetch cart: ${response.status}`);
        const cartData = await response.json();
        cart = cartData.items || [];

        const cartItems = document.querySelector('#cart-items tbody');
        const deficiencyDiv = document.getElementById('stock-deficiency');
        const deficiencyItems = document.getElementById('deficiency-items');
        const cartTotal = document.getElementById('cart-total');

        if (!cartItems || !cartTotal) {
            console.error('Cart items table or total element not found');
            return;
        }

        cartItems.innerHTML = '';
        let total = 0;

        cart.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.title || 'N/A'}</td>
                <td><input type="number" value="${item.quantity}" min="1" onchange="updateCartItem('${item.barcode}', this.value)"></td>
                <td>${(item.price || 0).toFixed(2)} VND</td>
                <td>${item.rushDelivery ? 'Yes' : 'No'}</td>
                <td><button class="remove-btn" onclick="removeCartItem('${item.barcode}')">Remove</button></td>
            `;
            cartItems.appendChild(row);
            total += (item.price || 0) * item.quantity;
        });

        cartTotal.textContent = `Total (excl. VAT): ${total.toFixed(2)} VND`;

        if (cartData.deficiencies && Object.keys(cartData.deficiencies).length > 0) {
            deficiencyItems.innerHTML = '';
            for (const [barcode, quantity] of Object.entries(cartData.deficiencies)) {
                const product = cart.find(item => item.barcode === barcode);
                const li = document.createElement('li');
                li.textContent = `${product ? product.title : barcode}: Short by ${quantity} units`;
                deficiencyItems.appendChild(li);
            }
            deficiencyDiv.style.display = 'block';
        } else {
            deficiencyDiv.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        alert('Error loading cart: ' + error.message);
        const cartItems = document.querySelector('#cart-items tbody');
        if (cartItems) cartItems.innerHTML = '<tr><td colspan="5">Error loading cart</td></tr>';
    }
}

async function updateCartItem(barcode, quantity) {
    quantity = parseInt(quantity);
    if (quantity <= 0) {
        await removeCartItem(barcode);
        return;
    }

    try {
        await fetch(`/api/carts/${sessionId}/items/${barcode}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            }
        });

        await fetch(`/api/carts/${sessionId}/items`, {
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
        console.error('Error updating cart item:', error);
        alert('Error updating cart item: ' + error.message);
    }
}

async function removeCartItem(barcode) {
    try {
        console.log(`Removing item: barcode=${barcode}, sessionId=${sessionId}`);
        const response = await fetch(`/api/carts/${sessionId}/items/${barcode}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            }
        });
        if (!response.ok) throw new Error(`Failed to remove cart item: ${response.status}`);
        await loadCart();
    } catch (error) {
        console.error('Error removing cart item:', error);
        alert('Error removing cart item: ' + error.message);
    }
}

async function clearCart() {
    try {
        console.log(`Clearing cart for sessionId: ${sessionId}`);
        const response = await fetch(`/api/carts/clear/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            }
        });
        if (!response.ok) throw new Error(`Failed to clear cart: ${response.status}`);
        await loadCart();
        alert('Cart cleared successfully.');
    } catch (error) {
        console.error('Error clearing cart:', error);
        alert('Error clearing cart: ' + error.message);
    }
}

async function checkStockAndProceed() {
    try {
        console.log(`Checking stock for sessionId: ${sessionId}`);
        const response = await fetch(`/api/carts/${sessionId}`, {
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            }
        });
        if (!response.ok) throw new Error(`Failed to fetch cart: ${response.status}`);
        const cartData = await response.json();

        if (cartData.items.length === 0) {
            alert('Cart is empty.');
            return;
        }

        if (cartData.deficiencies && Object.keys(cartData.deficiencies).length > 0) {
            alert('Please resolve stock deficiencies before proceeding.');
            return;
        }

        navigateTo('/pages/customer/order.html');
    } catch (error) {
        console.error('Error checking cart:', error);
        alert('Error checking cart: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Cart page loaded');
    loadCart();
});