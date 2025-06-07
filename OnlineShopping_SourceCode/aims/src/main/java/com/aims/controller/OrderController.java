package com.aims.controller;

import com.aims.model.Order;
import com.aims.model.Payment;
import com.aims.repository.OrderRepository;
import com.aims.repository.PaymentRepository;
import com.aims.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, Object> orderData) {
        logger.info("Creating new order for email: {}", orderData.get("email"));
        try {
            Order order = orderService.createOrder(orderData);
            String paymentUrl = orderService.createPaymentUrl(order);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "orderId", order.getOrderId(),
                    "paymentUrl", paymentUrl
            ));
        } catch (Exception e) {
            logger.error("Error creating order: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/from-cart")
    public ResponseEntity<Map<String, Object>> createOrderFromCart(
            @RequestBody Map<String, Object> orderData,
            @RequestParam String sessionId) {
        logger.info("Creating order from cart: sessionId={}", sessionId);
        try {
            Order order = orderService.createOrderFromCart(sessionId, orderData);
            String paymentUrl = orderService.createPaymentUrl(order);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "orderId", order.getOrderId(),
                    "paymentUrl", paymentUrl
            ));
        } catch (Exception e) {
            logger.error("Error creating order from cart: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/pay")
    public ResponseEntity<Map<String, Object>> handlePaymentCallback(@RequestParam Map<String, String> params) {
        logger.info("Handling VNPay payment callback for transaction: {}", params.get("vnp_TxnRef"));
        try {
            String vnpSecureHash = params.get("vnp_SecureHash");
            if (vnpSecureHash == null || vnpSecureHash.isEmpty()) {
                logger.error("Missing vnp_SecureHash in callback");
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Invalid signature"
                ));
            }

            // Verify signature
            boolean isValidSignature = orderService.verifyPaymentSignature(params, vnpSecureHash);
            if (!isValidSignature) {
                logger.error("Invalid signature for transaction: {}", params.get("vnp_TxnRef"));
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Invalid signature"
                ));
            }

            // Process payment
            String orderId = params.get("vnp_TxnRef");
            String transactionId = params.get("vnp_TransactionNo");
            String amount = params.get("vnp_Amount");
            String responseCode = params.get("vnp_ResponseCode");
            String transactionStatus = params.get("vnp_TransactionStatus");
            String transactionContent = params.get("vnp_OrderInfo");
            String transactionDate = params.get("vnp_PayDate");

            Order order = orderRepository.findById(Integer.parseInt(orderId))
                    .orElseThrow(() -> {
                        logger.error("Order not found: {}", orderId);
                        return new RuntimeException("Order not found");
                    });

            Payment payment = new Payment();
            payment.setTransactionId(transactionId);
            payment.setOrder(order);
            payment.setAmount(Double.parseDouble(amount) / 100);
            payment.setStatus(responseCode.equals("00") && transactionStatus.equals("00") ? "success" : "failed");
            payment.setTransactionContent(transactionContent);
            payment.setTransactionDatetime(LocalDateTime.parse(transactionDate, DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));

            paymentRepository.save(payment);
            logger.info("Saved payment for transaction: {}", transactionId);

            if (responseCode.equals("00") && transactionStatus.equals("00")) {
                order.setStatus("confirmed");
                orderRepository.save(order);
                logger.info("Order confirmed: {}", orderId);
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Payment successful",
                        "orderId", orderId
                ));
            } else {
                order.setStatus("failed");
                orderRepository.save(order);
                logger.warn("Payment failed for order: {}", orderId);
                return ResponseEntity.ok(Map.of(
                        "success", false,
                        "message", "Payment failed",
                        "orderId", orderId
                ));
            }
        } catch (Exception e) {
            logger.error("Error processing payment callback: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}