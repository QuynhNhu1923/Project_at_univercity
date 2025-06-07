package com.aims.service;

import com.aims.model.Cart;
import com.aims.model.CartItem;
import com.aims.model.Order;
import com.aims.model.OrderItem;
import com.aims.model.Product;
import com.aims.repository.CartRepository;
import com.aims.repository.OrderRepository;
import com.aims.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.transaction.Transactional;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@Transactional
public class OrderService {
    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private EmailService emailService;

    @Value("${vnpay.tmnCode}")
    private String vnp_TmnCode;

    @Value("${vnpay.secretKey}")
    private String vnp_SecretKey;

    @Value("${vnpay.url}")
    private String vnp_Url;

    @Value("${vnpay.returnUrl}")
    private String vnp_ReturnUrl;

    public Order createOrder(Map<String, Object> orderData) {
        logger.info("Creating order for email: {}", orderData.get("email"));
        if (orderData.get("items") == null || ((List<?>) orderData.get("items")).isEmpty()) {
            logger.error("No items provided for order");
            throw new IllegalArgumentException("Order must contain at least one item");
        }

        Order order = new Order();
        order.setCustomerName((String) orderData.get("customerName"));
        order.setEmail((String) orderData.get("email"));
        order.setPhone((String) orderData.get("phone"));
        order.setProvinceCity((String) orderData.get("provinceCity"));
        order.setDeliveryAddress((String) orderData.get("deliveryAddress"));
        order.setDeliveryMethod((String) orderData.get("deliveryMethod"));
        order.setDeliveryFee(Double.parseDouble(orderData.get("deliveryFee").toString()));
        order.setTotalAmount(Double.parseDouble(orderData.get("totalAmount").toString()));
        order.setStatus("pending");

        List<Map<String, Object>> items = (List<Map<String, Object>>) orderData.get("items");
        List<OrderItem> orderItems = new ArrayList<>();
        for (Map<String, Object> item : items) {
            String barcode = (String) item.get("barcode");
            int quantity = Integer.parseInt(item.get("quantity").toString());
            Product product = productRepository.findByBarcode(barcode);
            if (product == null) {
                logger.error("Product not found: {}", barcode);
                throw new RuntimeException("Product not found: " + barcode);
            }
            if (quantity <= 0 || quantity > product.getQuantity()) {
                logger.error("Invalid quantity for product {}: requested {}, available {}", barcode, quantity, product.getQuantity());
                throw new RuntimeException("Invalid quantity for product: " + product.getTitle());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(quantity);
            orderItem.setPriceAtOrder(Double.parseDouble(item.get("price").toString()));
            orderItems.add(orderItem);
        }

        order.setOrderItems(orderItems);
        Order savedOrder = orderRepository.save(order);
        try {
            emailService.sendOrderConfirmation(savedOrder);
            logger.info("Sent confirmation email for order: {}", savedOrder.getOrderId());
        } catch (MessagingException e) {
            logger.error("Failed to send confirmation email for order {}: {}", savedOrder.getOrderId(), e.getMessage());
        }
        logger.info("Order created: {}", savedOrder.getOrderId());
        return savedOrder;
    }

    public Order createOrderFromCart(String sessionId, Map<String, Object> orderData) {
        logger.info("Creating order from cart: sessionId={}", sessionId);
        Cart cart = cartRepository.findBySessionId(sessionId)
                .orElseThrow(() -> {
                    logger.error("Cart not found: {}", sessionId);
                    return new RuntimeException("Cart not found");
                });

        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            logger.error("Cart is empty: {}", sessionId);
            throw new RuntimeException("Cart is empty");
        }

        Order order = new Order();
        order.setCustomerName((String) orderData.get("customerName"));
        order.setEmail((String) orderData.get("email"));
        order.setPhone((String) orderData.get("phone"));
        order.setProvinceCity((String) orderData.get("provinceCity"));
        order.setDeliveryAddress((String) orderData.get("deliveryAddress"));
        order.setDeliveryMethod((String) orderData.get("deliveryMethod"));
        order.setDeliveryFee(Double.parseDouble(orderData.get("deliveryFee").toString()));
        order.setTotalAmount(Double.parseDouble(orderData.get("totalAmount").toString()));
        order.setStatus("pending");

        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cart.getCartItems()) {
            Product product = cartItem.getProduct();
            int quantity = cartItem.getQuantity();
            if (quantity <= 0 || quantity > product.getQuantity()) {
                logger.error("Invalid quantity for product {}: requested {}, available {}", product.getBarcode(), quantity, product.getQuantity());
                throw new RuntimeException("Invalid quantity for product: " + product.getTitle());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(quantity);
            orderItem.setPriceAtOrder(product.getPrice());
            orderItems.add(orderItem);
        }

        order.setOrderItems(orderItems);
        Order savedOrder = orderRepository.save(order);

        // Clear cart after order creation
        cart.getCartItems().clear();
        cartRepository.save(cart);
        logger.info("Cleared cart: {}", sessionId);

        try {
            emailService.sendOrderConfirmation(savedOrder);
            logger.info("Sent confirmation email for order: {}", savedOrder.getOrderId());
        } catch (MessagingException e) {
            logger.error("Failed to send confirmation email for order {}: {}", savedOrder.getOrderId(), e.getMessage());
        }
        logger.info("Order created from cart: {}", savedOrder.getOrderId());
        return savedOrder;
    }

    public String createPaymentUrl(Order order) throws Exception {
        if (order == null || order.getTotalAmount() <= 0) {
            logger.error("Invalid order or amount for payment URL");
            throw new IllegalArgumentException("Invalid order or amount");
        }

        logger.info("Generating VNPay payment URL for order: {}", order.getOrderId());
        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnp_TmnCode);
        vnpParams.put("vnp_Amount", String.valueOf((int) (order.getTotalAmount() * 100)));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", String.valueOf(order.getOrderId()));
        vnpParams.put("vnp_OrderInfo", "Payment for order #" + order.getOrderId());
        vnpParams.put("vnp_OrderType", "billpayment");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnp_ReturnUrl);
        vnpParams.put("vnp_IpAddr", "127.0.0.1");

        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
        vnpParams.put("vnp_CreateDate", sdf.format(new Date()));

        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        for (String fieldName : fieldNames) {
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName).append("=")
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8)).append("&");
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8)).append("=")
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8)).append("&");
            }
        }
        if (hashData.length() > 0) {
            hashData.setLength(hashData.length() - 1);
        }
        if (query.length() > 0) {
            query.setLength(query.length() - 1);
        }

        String vnpSecureHash = hmacSHA512(vnp_SecretKey, hashData.toString());
        query.append("&vnp_SecureHash=").append(vnpSecureHash);

        String paymentUrl = vnp_Url + "?" + query.toString();
        logger.info("Payment URL generated: {}", paymentUrl);
        return paymentUrl;
    }

    public boolean verifyPaymentSignature(Map<String, String> params, String receivedSecureHash) {
        logger.info("Verifying VNPay payment signature for transaction: {}", params.get("vnp_TxnRef"));
        try {
            List<String> fieldNames = new ArrayList<>(params.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            for (String fieldName : fieldNames) {
                if (!fieldName.equals("vnp_SecureHash") && !fieldName.equals("vnp_SecureHashType")) {
                    String fieldValue = params.get(fieldName);
                    if (fieldValue != null && !fieldValue.isEmpty()) {
                        hashData.append(fieldName).append("=")
                                .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8)).append("&");
                    }
                }
            }
            if (hashData.length() > 0) {
                hashData.setLength(hashData.length() - 1);
            }

            String computedHash = hmacSHA512(vnp_SecretKey, hashData.toString());
            boolean isValid = computedHash.equalsIgnoreCase(receivedSecureHash);
            logger.info("Signature verification {} for transaction: {}", isValid ? "successful" : "failed", params.get("vnp_TxnRef"));
            return isValid;
        } catch (Exception e) {
            logger.error("Failed to verify payment signature: {}", e.getMessage());
            return false;
        }
    }

    private String hmacSHA512(String key, String data) throws Exception {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA512");
            mac.init(new javax.crypto.spec.SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            logger.error("Failed to generate HMAC SHA512: {}", e.getMessage());
            throw e;
        }
    }
}