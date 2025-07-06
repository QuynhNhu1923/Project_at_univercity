document.addEventListener('DOMContentLoaded', () => {
    const sessionId = localStorage.getItem('sessionId') || 'guest_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
    loadCart();

    // Thêm sự kiện cho các input quantity
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('quantity-input')) {
            const barcode = e.target.dataset.barcode;
            let quantity = parseInt(e.target.value);
            if (isNaN(quantity) || quantity < 1) {
                quantity = 1; // Đặt lại giá trị tối thiểu
                e.target.value = quantity;
            }
            updateCartItem(sessionId, barcode, quantity);
        }
    });

    // Thêm sự kiện cho các nút tăng/giảm
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quantity-btn')) {
            const barcode = e.target.dataset.barcode;
            const input = document.querySelector(`input[data-barcode="${barcode}"]`);
            let quantity = parseInt(input.value);
            if (e.target.classList.contains('increment-btn')) {
                quantity += 1;
                input.value = quantity;
                updateCartItem(sessionId, barcode, quantity);
            } else if (e.target.classList.contains('decrement-btn')) {
                if (quantity > 1) {
                    quantity -= 1;
                    input.value = quantity;
                    updateCartItem(sessionId, barcode, quantity);
                } else {
                    removeFromCart(sessionId, barcode);
                }
            }
        }
    });

    // Thêm sự kiện cho nút remove
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const barcode = e.target.dataset.barcode;
            removeFromCart(sessionId, barcode);
        }
    });

    // Sự kiện cho các nút action
    document.getElementById('clear-cart-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your cart?')) {
            clearCart(sessionId);
        }
    });

    document.getElementById('proceed-order-btn').addEventListener('click', () => {
        proceedToOrder();
    });

    document.getElementById('back-dashboard-btn').addEventListener('click', () => {
        window.location.href = '../customer/customer-dashboard.html';
    });
});

async function loadCart() {
    try {
        const response = await fetch(`/api/carts/${sessionId}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 404 && errorData.errorMessage?.includes('Cart not found')) {
                await fetch(`/api/carts/${sessionId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId })
                });
                return loadCart();
            }
            throw new Error(errorData.errorMessage || `Failed to fetch cart: ${response.status}`);
        }

        const cart = await response.json();
        const cartItems = document.getElementById('cart-items').getElementsByTagName('tbody')[0];
        cartItems.innerHTML = '';
        let subtotal = 0;
        const maxItems = 30;
        const itemsToShow = cart.items ? cart.items.slice(0, maxItems) : [];

        if (!cart.items || itemsToShow.length === 0) {
            showEmptyCart();
        } else {
            itemsToShow.forEach(item => {
                const totalPerItem = (item.price || 0) * (item.quantity || 0);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        ${item.title || 'N/A'}
                        ${item.rushDelivery ? '<span class="rush-delivery-badge">Rush Available</span>' : ''}
                    </td>
                    <td>
                        <div class="quantity">
                            <button class="quantity-btn decrement-btn" data-barcode="${item.barcode || ''}">-</button>
                            <input type="number" class="quantity-input" data-barcode="${item.barcode || ''}" value="${item.quantity || 1}" min="1">
                            <button class="quantity-btn increment-btn" data-barcode="${item.barcode || ''}">+</button>
                        </div>
                    </td>
                    <td>${formatCurrency(item.price || 0)}</td>
                    <td>${formatCurrency(totalPerItem)}</td>
                    <td><button class="remove-btn" data-barcode="${item.barcode || ''}">Remove</button></td>
                `;
                cartItems.appendChild(row);
                subtotal += totalPerItem;
            });
        }

        // Cập nhật tổng giá
        const vat = subtotal * 0.1;
        const total = subtotal + vat;
        document.getElementById('cart-subtotal').textContent = formatCurrency(subtotal);
        document.getElementById('cart-vat').textContent = formatCurrency(vat);
        document.getElementById('cart-total').textContent = formatCurrency(total);

        // Hiển thị cảnh báo thiếu hàng
        const deficiencyWarning = document.getElementById('stock-deficiency-warning');
        const proceedBtn = document.getElementById('proceed-order-btn');
        if (cart.deficiencies && Object.keys(cart.deficiencies).length > 0) {
            const deficiencyList = Object.entries(cart.deficiencies)
                .map(([barcode, qty]) => `${barcode}: ${qty} items short`)
                .join(', ');
            deficiencyWarning.innerHTML = `
                <strong>⚠️ Stock Warning:</strong> ${deficiencyList}
                <br><small>Please adjust quantities before proceeding to checkout.</small>
            `;
            deficiencyWarning.style.display = 'block';
            proceedBtn.disabled = true;
            proceedBtn.style.opacity = '0.5';
            proceedBtn.style.cursor = 'not-allowed';
        } else {
            deficiencyWarning.style.display = 'none';
            proceedBtn.disabled = !cart.items || cart.items.length === 0;
            proceedBtn.style.opacity = proceedBtn.disabled ? '0.5' : '1';
            proceedBtn.style.cursor = proceedBtn.disabled ? 'not-allowed' : 'pointer';
        }

        // Cảnh báo nếu vượt quá 30 sản phẩm
        if (cart.items && cart.items.length > maxItems) {
            const warningRow = document.createElement('tr');
            warningRow.innerHTML = `
                <td colspan="5" style="text-align: center; color: #e67e22; font-style: italic;">
                    Only the first ${maxItems} items are displayed. Please proceed to checkout to view all items.
                </td>
            `;
            cartItems.appendChild(warningRow);
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        showEmptyCart('Error loading cart: ' + error.message);
    }
}

function showEmptyCart(message = 'Your cart is empty') {
    const cartItems = document.getElementById('cart-items').getElementsByTagName('tbody')[0];
    cartItems.innerHTML = `
        <tr>
            <td colspan="5" class="empty-cart">
                <div>🛒</div>
                <h3>${message}</h3>
                <p>Add some products to your cart to get started!</p>
            </td>
        </tr>
    `;
    document.getElementById('cart-subtotal').textContent = formatCurrency(0);
    document.getElementById('cart-vat').textContent = formatCurrency(0);
    document.getElementById('cart-total').textContent = formatCurrency(0);
    const proceedBtn = document.getElementById('proceed-order-btn');
    proceedBtn.disabled = true;
    proceedBtn.style.opacity = '0.5';
    proceedBtn.style.cursor = 'not-allowed';
}

async function updateCartItem(sessionId, barcode, quantity) {
    try {
        const response = await fetch(`/api/carts/${sessionId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ barcode, quantity })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.errorMessage || `Failed to update cart item: ${response.status}`);
        }
        await loadCart();
        showErrorMessage('Cart item updated successfully!', false);
    } catch (error) {
        console.error('Error updating cart item:', error);
        showErrorMessage(`Failed to update cart item: ${error.message}`);
        await loadCart();
    }
}

async function removeFromCart(sessionId, barcode) {
    try {
        const response = await fetch(`/api/carts/${sessionId}/items/${barcode}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.errorMessage || `Failed to remove item: ${response.status}`);
        }
        await loadCart();
        showErrorMessage('Item removed successfully!', false);
    } catch (error) {
        console.error('Error removing item:', error);
        showErrorMessage(`Failed to remove item: ${error.message}`);
    }
}

async function clearCart(sessionId) {
    try {
        const response = await fetch(`/api/carts/${sessionId}/clear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.errorMessage || `Failed to clear cart: ${response.status}`);
        }
        await loadCart();
        showErrorMessage('Cart cleared successfully!', false);
    } catch (error) {
        console.error('Error clearing cart:', error);
        showErrorMessage(`Failed to clear cart: ${error.message}`);
    }
}

async function proceedToOrder() {
    try {
        const response = await fetch(`/api/carts/${sessionId}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.errorMessage || `Failed to check cart status: ${response.status}`);
        }

        const cart = await response.json();
        if (!cart.items || cart.items.length === 0) {
            showErrorMessage('Your cart is empty. Please add items before placing an order.');
            return;
        }

        if (cart.deficiencies && Object.keys(cart.deficiencies).length > 0) {
            showErrorMessage('Some items in your cart are out of stock. Please adjust quantities or remove unavailable items.');
            return;
        }

        const deliveryInfo = prompt('Enter your delivery address:');
        if (!deliveryInfo || deliveryInfo.trim() === '') {
            showErrorMessage('Delivery address is required.');
            return;
        }

        const orderResponse = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, deliveryInfo })
        });
        if (!orderResponse.ok) {
            const errorData = await orderResponse.json().catch(() => ({}));
            throw new Error(errorData.errorMessage || `Failed to place order: ${orderResponse.status}`);
        }

        showErrorMessage('Order placed successfully!', false);
        await loadCart();
    } catch (error) {
        console.error('Error proceeding to order:', error);
        showErrorMessage(`Failed to place order: ${error.message}`);
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount || 0);
}

function showErrorMessage(message, isError = true) {
    const deficiencyWarning = document.getElementById('stock-deficiency-warning');
    deficiencyWarning.innerHTML = `
        <strong>${isError ? '⚠️ Error' : '✅ Success'}:</strong> ${message}
    `;
    deficiencyWarning.style.background = isError ? '#f8d7da' : '#d4edda';
    deficiencyWarning.style.color = isError ? '#721c24' : '#155724';
    deficiencyWarning.style.borderColor = isError ? '#f5c6cb' : '#c3e6cb';
    deficiencyWarning.style.display = 'block';
}