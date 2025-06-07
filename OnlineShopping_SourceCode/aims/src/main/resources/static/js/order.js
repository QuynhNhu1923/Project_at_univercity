/* Đặt hàng */
async function placeOrder(event) {
    event.preventDefault();
    const orderData = {
        name: document.getElementById('order-name').value,
        email: document.getElementById('order-email').value,
        phone: document.getElementById('order-phone').value,
        address: document.getElementById('order-address').value,
        rushOrder: document.getElementById('rush-order').checked,
        deliveryTime: document.getElementById('delivery-time').value || null,
        deliveryInstructions: document.getElementById('delivery-instructions').value || '',
        cardNumber: document.getElementById('card-number').value,
        cardExpiry: document.getElementById('card-expiry').value,
        cardCvc: document.getElementById('card-cvc').value,
        sessionId
    };
    const errorElement = document.getElementById('order-error');
    errorElement.classList.add('hidden');
    try {
        const stockResponse = await fetch(`http://localhost:8080/api/carts/${sessionId}/check-stock`);
        if (!stockResponse.ok) throw new Error('Some products are out of stock.');
        const paymentResponse = await initiateVNPayPayment(orderData);
        if (!paymentResponse.success) throw new Error('Payment initiation failed.');
        const response = await fetch('http://localhost:8080/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...orderData, paymentId: paymentResponse.paymentId })
        });
        if (!response.ok) throw new Error('Failed to place order.');
        alert('Order placed successfully.');
        sessionStorage.setItem('orderEmail', orderData.email);
        cart = [];
        sessionId = Math.random().toString(36).substring(2);
        navigateTo('customer/dashboard.html');
    } catch (error) {
        errorElement.textContent = 'Error placing order: ' + error.message;
        errorElement.classList.remove('hidden');
    }
}

/* Tải danh sách đơn hàng của khách hàng */
async function loadCustomerOrders() {
    const email = document.getElementById('order-email').value || sessionStorage.getItem('orderEmail') || '';
    if (!email) {
        alert('Please enter an email to view orders.');
        return;
    }
    try {
        const response = await fetch(`http://localhost:8080/api/orders?page=${currentPage('orders')}&size=30&email=${encodeURIComponent(email)}`);
        if (!response.ok) throw new Error('Failed to fetch orders.');
        const data = await response.json();
        const orderList = document.querySelector('#customer-orders tbody');
        orderList.innerHTML = '';
        data.content.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>${order.total} VND</td>
                <td>${order.status}</td>
                <td>
                    <button onclick="viewOrderDetails(${order.id})">View</button>
                    <button onclick="cancelOrder(${order.id})" ${order.status !== 'PENDING' ? 'disabled' : ''}>Cancel</button>
                </td>
            `;
            orderList.appendChild(row);
        });
    } catch (error) {
        alert('Error loading orders: ' + error.message);
    }
}

/* Xem chi tiết đơn hàng */
async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`http://localhost:8080/api/orders/${orderId}`);
        if (!response.ok) throw new Error('Failed to fetch order details.');
        const order = await response.json();
        alert(`Order ID: ${order.id}\nCustomer: ${order.customerName}\nTotal: ${order.total} VND\nStatus: ${order.status}`);
    } catch (error) {
        alert('Error fetching order details: ' + error.message);
    }
}

/* Hủy đơn hàng */
async function cancelOrder(orderId) {
    try {
        const orderResponse = await fetch(`http://localhost:8080/api/orders/${orderId}`);
        const order = await orderResponse.json();
        const refundResponse = await initiateVNPayRefund(order.paymentId, order.total);
        if (!refundResponse.success) throw new Error('Refund failed.');
        const response = await fetch(`http://localhost:8080/api/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refundId: refundResponse.refundId })
        });
        if (!response.ok) throw new Error('Failed to cancel order.');
        alert('Order cancelled and refunded.');
        loadCustomerOrders();
    } catch (error) {
        alert('Error cancelling order: ' + error.message);
    }
}

/* Tải danh sách đơn hàng chờ xử lý */
async function loadPendingOrders() {
    try {
        const response = await fetch(`http://localhost:8080/api/orders?page=${currentPage('pendingOrders')}&size=30&status=PENDING`);
        if (!response.ok) throw new Error('Failed to fetch pending orders.');
        const data = await response.json();
        const orderList = document.querySelector('#pending-orders tbody');
        orderList.innerHTML = '';
        data.content.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${order.customerName}</td>
                <td>${order.total} VND</td>
                <td>${order.status}</td>
                <td>
                    <button onclick="approveOrder(${order.id})">Approve</button>
                    <button onclick="rejectOrder(${order.id})">Reject</button>
                </td>
            `;
            orderList.appendChild(row);
        });
    } catch (error) {
        alert('Error loading pending orders: ' + error.message);
    }
}

/* Duyệt đơn hàng */
async function approveOrder(orderId) {
    try {
        const stockResponse = await fetch(`http://localhost:8080/api/orders/${orderId}/check-stock`);
        if (!stockResponse.ok) throw new Error('Insufficient stock for some products.');
        const response = await fetch(`http://localhost:8080/api/orders/${orderId}/approve`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Failed to approve order.');
        alert('Order approved.');
        loadPendingOrders();
    } catch (error) {
        alert('Error approving order: ' + error.message);
    }
}

/* Từ chối đơn hàng */
async function rejectOrder(orderId) {
    try {
        const orderResponse = await fetch(`http://localhost:8080/api/orders/${orderId}`);
        const order = await orderResponse.json();
        const refundResponse = await initiateVNPayRefund(order.paymentId, order.total);
        if (!refundResponse.success) throw new Error('Refund failed.');
        const response = await fetch(`http://localhost:8080/api/orders/${orderId}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refundId: refundResponse.refundId })
        });
        if (!response.ok) throw new Error('Failed to reject order.');
        alert('Order rejected and refunded.');
        loadPendingOrders();
    } catch (error) {
        alert('Error rejecting order: ' + error.message);
    }
}

/* Cập nhật tổng tiền và phí giao hàng */
function updateOrderSummary() {
    const rushOrder = document.getElementById('rush-order').checked;
    let deliveryFee = rushOrder ? 50000 : 30000;
    let total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    total = total * 1.1; // Thêm 10% VAT
    total += deliveryFee;
    document.getElementById('delivery-fee').textContent = `${deliveryFee} VND`;
    document.getElementById('order-total').textContent = `${total} VND`;
}

/* Hiển thị/ẩn chi tiết giao hàng hỏa tốc */
function toggleRushOrderDetails() {
    const rushOrderDetails = document.getElementById('rush-order-details');
    const rushOrder = document.getElementById('rush-order').checked;
    rushOrderDetails.classList.toggle('hidden', !rushOrder);
    if (rushOrder && !/Hanoi/i.test(document.getElementById('order-address').value)) {
        alert('Rush delivery is only available in Hanoi.');
        document.getElementById('rush-order').checked = false;
        rushOrderDetails.classList.add('hidden');
    }
    updateOrderSummary();
}

/* Điều hướng trang trước/sau */
function prevOrderPage() {
    if (currentPage('orders') > 0) {
        updateCurrentPage('orders', currentPage('orders') - 1);
        loadCustomerOrders();
    }
}
function nextOrderPage() {
    updateCurrentPage('orders', currentPage('orders') + 1);
    loadCustomerOrders();
}
function prevPendingOrderPage() {
    if (currentPage('pendingOrders') > 0) {
        updateCurrentPage('pendingOrders', currentPage('pendingOrders') - 1);
        loadPendingOrders();
    }
}
function nextPendingOrderPage() {
    updateCurrentPage('pendingOrders', currentPage('pendingOrders') + 1);
    loadPendingOrders();
}