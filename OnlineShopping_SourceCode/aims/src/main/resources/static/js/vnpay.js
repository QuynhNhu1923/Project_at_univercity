/* Khởi tạo thanh toán VNPay */
async function initiateVNPayPayment(orderData) {
    try {
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0) * 1.1 + (orderData.rushOrder ? 50000 : 30000);
        const response = await fetch('http://localhost:8080/api/payments/vnpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: `ORDER_${sessionId}_${Date.now()}`,
                amount: total,
                orderInfo: `Payment for order by ${orderData.email}`,
                returnUrl: 'http://localhost:8080/pages/customer/orders.html'
            })
        });
        if (!response.ok) throw new Error('Failed to initiate VNPay payment.');
        const data = await response.json();
        window.location.href = data.paymentUrl; // Chuyển hướng đến cổng VNPay
        return { success: true, paymentId: data.paymentId };
    }