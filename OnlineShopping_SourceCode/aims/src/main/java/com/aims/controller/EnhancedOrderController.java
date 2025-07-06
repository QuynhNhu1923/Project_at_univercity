package com.aims.controller;

import com.aims.model.Order;
import com.aims.model.Payment;
import com.aims.repository.OrderRepository;
import com.aims.repository.PaymentRepository;
import com.aims.service.EmailService;
import com.aims.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class EnhancedOrderController {
    private static final Logger logger = LoggerFactory.getLogger(EnhancedOrderController.class);

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private EmailService emailService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, Object> orderData) {
        logger.info("Creating new order for email: {}", orderData.get("email"));
        try {
            // Validate required fields
            validateOrderData(orderData);
            
            Order order = orderService.createOrder(orderData);
            String paymentUrl = orderService.createPaymentUrl(order);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("orderId", order.getOrderId());
            response.put("paymentUrl", paymentUrl);
            response.put("message", "Order created successfully. Redirecting to payment...");
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid order data: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            logger.error("Error creating order: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "Internal server error: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/from-cart")
    public ResponseEntity<Map<String, Object>> createOrderFromCart(
            @RequestBody Map<String, Object> orderData,
            @RequestParam String sessionId) {
        logger.info("Creating order from cart: sessionId={}, email={}", sessionId, orderData.get("email"));
        try {
            // Validate required fields
            validateOrderData(orderData);
            
            if (sessionId == null || sessionId.trim().isEmpty()) {
                throw new IllegalArgumentException("Session ID is required");
            }
            
            Order order = orderService.createOrderFromCart(sessionId, orderData);
            String paymentUrl = orderService.createPaymentUrl(order);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("orderId", order.getOrderId());
            response.put("paymentUrl", paymentUrl);
            response.put("message", "Order created successfully from cart. Redirecting to payment...");
            
            logger.info("Order {} created from cart {} with payment URL generated", order.getOrderId(), sessionId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid order data for cart {}: {}", sessionId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        } catch (RuntimeException e) {
            logger.error("Runtime error creating order from cart {}: {}", sessionId, e.getMessage());
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            logger.error("Error creating order from cart {}: {}", sessionId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "Internal server error: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/payment-return")
    public ResponseEntity<Map<String, Object>> handlePaymentReturn(@RequestParam Map<String, String> params) {
        logger.info("Handling VNPay payment return for transaction: {}", params.get("vnp_TxnRef"));
        try {
            String vnpSecureHash = params.get("vnp_SecureHash");
            if (vnpSecureHash == null || vnpSecureHash.isEmpty()) {
                logger.error("Missing vnp_SecureHash in payment return");
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Invalid payment response - missing signature"
                ));
            }

            // Verify signature
            boolean isValidSignature = orderService.verifyPaymentSignature(params, vnpSecureHash);
            if (!isValidSignature) {
                logger.error("Invalid signature for transaction: {}", params.get("vnp_TxnRef"));
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Invalid payment signature"
                ));
            }

            // Extract payment information
            String orderIdStr = params.get("vnp_TxnRef");
            String transactionId = params.get("vnp_TransactionNo");
            String amountStr = params.get("vnp_Amount");
            String responseCode = params.get("vnp_ResponseCode");
            String transactionStatus = params.get("vnp_TransactionStatus");
            String transactionContent = params.get("vnp_OrderInfo");
            String transactionDate = params.get("vnp_PayDate");

            if (orderIdStr == null || transactionId == null || amountStr == null) {
                logger.error("Missing required payment parameters");
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Missing required payment information"
                ));
            }

            Integer orderId = Integer.parseInt(orderIdStr);
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> {
                        logger.error("Order not found: {}", orderId);
                        return new RuntimeException("Order not found: " + orderId);
                    });

            // Create payment record
            Payment payment = new Payment();
            payment.setTransactionId(transactionId);
            payment.setOrder(order);
            payment.setAmount(Double.parseDouble(amountStr) / 100.0); // Convert from cents
            payment.setTransactionContent(transactionContent);
            payment.setTransactionDatetime(parseVnpayDate(transactionDate));

            // Determine payment and order status
            boolean isPaymentSuccessful = "00".equals(responseCode) && "00".equals(transactionStatus);
            payment.setStatus(isPaymentSuccessful ? "success" : "failed");

            paymentRepository.save(payment);
            logger.info("Saved payment record for transaction: {}", transactionId);

            Map<String, Object> response = new HashMap<>();
            if (isPaymentSuccessful) {
                order.setStatus("confirmed");
                orderRepository.save(order);
                logger.info("Order confirmed: {}", orderId);
                
                response.put("success", true);
                response.put("message", "Payment successful! Your order has been confirmed.");
                response.put("orderId", orderId);
                response.put("transactionId", transactionId);
            } else {
                order.setStatus("payment_failed");
                orderRepository.save(order);
                logger.warn("Payment failed for order: {} with response code: {}", orderId, responseCode);
                
                response.put("success", false);
                response.put("message", "Payment failed. Please try again or contact support.");
                response.put("orderId", orderId);
                response.put("errorCode", responseCode);
            }

            return ResponseEntity.ok(response);
        } catch (NumberFormatException e) {
            logger.error("Invalid number format in payment return: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Invalid payment data format"
            ));
        } catch (Exception e) {
            logger.error("Error processing payment return: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "Error processing payment: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/payment-success-mock/{orderId}")
    public ResponseEntity<String> mockPaymentSuccess(@PathVariable Integer orderId) {
        logger.info("Mock payment success for order: {}", orderId);
        try {
            Order order = orderService.getOrderById(orderId);
            order.setStatus("confirmed");
            orderRepository.save(order);
            
            // Create mock payment record
            Payment payment = new Payment();
            payment.setTransactionId("MOCK_" + System.currentTimeMillis());
            payment.setOrder(order);
            payment.setAmount(order.getTotalAmount());
            payment.setStatus("success");
            payment.setTransactionContent("Mock payment for testing order #" + orderId);
            payment.setTransactionDatetime(LocalDateTime.now());
            paymentRepository.save(payment);
            
            logger.info("Mock payment processed successfully for order: {}", orderId);
            
            return ResponseEntity.ok("""
                <html>
                <head>
                    <title>Payment Success</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 50px; text-align: center; }
                        .success { color: #28a745; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                        a { display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; }
                        a:hover { background-color: #0056b3; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 class="success">🎉 Payment Successful!</h1>
                        <p>Order #%d has been confirmed.</p>
                        <p>Thank you for your purchase!</p>
                        <p>You will receive an email confirmation shortly.</p>
                        <a href="/pages/customer/customer-dashboard.html">Back to Dashboard</a>
                    </div>
                </body>
                </html>
                """.formatted(orderId));
        } catch (Exception e) {
            logger.error("Error in mock payment for order {}: {}", orderId, e.getMessage());
            return ResponseEntity.badRequest().body("""
                <html>
                <head><title>Payment Error</title></head>
                <body style="font-family: Arial, sans-serif; margin: 50px; text-align: center;">
                    <h1 style="color: #dc3545;">❌ Order Not Found</h1>
                    <p>Order ID: %d not found</p>
                    <a href="/pages/customer/customer-dashboard.html" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Back to Dashboard</a>
                </body>
                </html>
                """.formatted(orderId));
        }
    }

    @PostMapping("/test-payment-success/{orderId}")
    public ResponseEntity<Map<String, Object>> testPaymentSuccess(@PathVariable Integer orderId) {
        logger.info("Testing payment success for order: {}", orderId);
        try {
            Order order = orderService.getOrderById(orderId);
            
            // Create payment record
            Payment payment = new Payment();
            payment.setTransactionId("TEST_" + System.currentTimeMillis());
            payment.setOrder(order);
            payment.setAmount(order.getTotalAmount());
            payment.setStatus("success");
            payment.setTransactionContent("Test payment for order #" + orderId);
            payment.setTransactionDatetime(LocalDateTime.now());
            paymentRepository.save(payment);
            
            // Update order status
            order.setStatus("confirmed");
            orderRepository.save(order);
            
            // Send email confirmation
            try {
                emailService.sendOrderConfirmation(order);
                logger.info("Confirmation email sent for order: {}", orderId);
            } catch (Exception emailError) {
                logger.warn("Failed to send confirmation email for order {}: {}", orderId, emailError.getMessage());
            }
            
            logger.info("Test payment processed successfully for order: {}", orderId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Test payment successful",
                "orderId", orderId,
                "transactionId", payment.getTransactionId(),
                "amount", payment.getAmount(),
                "orderStatus", order.getStatus()
            ));
        } catch (RuntimeException e) {
            logger.error("Order not found for test payment: {}", orderId);
            return ResponseEntity.status(404).body(Map.of(
                "success", false,
                "error", "Order not found"
            ));
        } catch (Exception e) {
            logger.error("Error processing test payment for order {}: {}", orderId, e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Map<String, Object>> getOrderDetails(@PathVariable Integer orderId) {
        logger.info("Fetching order details: {}", orderId);
        try {
            Order order = orderService.getOrderById(orderId);
            
            Map<String, Object> orderDetails = new HashMap<>();
            orderDetails.put("orderId", order.getOrderId());
            orderDetails.put("customerName", order.getCustomerName());
            orderDetails.put("email", order.getEmail());
            orderDetails.put("phone", order.getPhone());
            orderDetails.put("deliveryAddress", order.getDeliveryAddress());
            orderDetails.put("provinceCity", order.getProvinceCity());
            orderDetails.put("deliveryMethod", order.getDeliveryMethod());
            orderDetails.put("deliveryFee", order.getDeliveryFee());
            orderDetails.put("totalAmount", order.getTotalAmount());
            orderDetails.put("status", order.getStatus());
            orderDetails.put("createdAt", order.getCreatedAt());
            orderDetails.put("items", order.getOrderItems());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "order", orderDetails
            ));
        } catch (RuntimeException e) {
            logger.error("Order not found: {}", orderId);
            return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Order not found"
            ));
        } catch (Exception e) {
            logger.error("Error fetching order {}: {}", orderId, e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "Error fetching order details"
            ));
        }
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(@PathVariable Integer orderId) {
        logger.info("Cancelling order: {}", orderId);
        try {
            Order order = orderService.getOrderById(orderId);
            
            if (!"pending".equals(order.getStatus()) && !"confirmed".equals(order.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Order cannot be cancelled in current status: " + order.getStatus()
                ));
            }

            orderService.updateOrderStatus(orderId, "cancelled");
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Order cancelled successfully"
            ));
        } catch (RuntimeException e) {
            logger.error("Order not found for cancellation: {}", orderId);
            return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Order not found"
            ));
        } catch (Exception e) {
            logger.error("Error cancelling order {}: {}", orderId, e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "Error cancelling order"
            ));
        }
    }

    private void validateOrderData(Map<String, Object> orderData) {
        String[] requiredFields = {"customerName", "email", "phone", "provinceCity", "deliveryAddress", "deliveryFee", "totalAmount"};
        
        for (String field : requiredFields) {
            if (!orderData.containsKey(field) || orderData.get(field) == null) {
                throw new IllegalArgumentException("Missing required field: " + field);
            }
            
            if (orderData.get(field) instanceof String && ((String) orderData.get(field)).trim().isEmpty()) {
                throw new IllegalArgumentException("Field cannot be empty: " + field);
            }
        }

        // Validate email format
        String email = (String) orderData.get("email");
        if (!email.matches("^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$")) {
            throw new IllegalArgumentException("Invalid email format");
        }

        // Validate numeric fields
        try {
            Double.parseDouble(orderData.get("deliveryFee").toString());
            Double.parseDouble(orderData.get("totalAmount").toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid numeric values for fees or amounts");
        }
    }

    private LocalDateTime parseVnpayDate(String vnpayDate) {
        try {
            if (vnpayDate != null && vnpayDate.length() == 14) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
                return LocalDateTime.parse(vnpayDate, formatter);
            }
        } catch (Exception e) {
            logger.warn("Failed to parse VNPay date: {}", vnpayDate);
        }
        return LocalDateTime.now();
    }
}