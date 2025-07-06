package com.aims.service;

import com.aims.model.*;
import com.aims.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalTime;
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
    private OrderItemRepository orderItemRepository;

    @Autowired
    private RushOrderDetailRepository rushOrderDetailRepository;

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

        // Save order first to get ID
        Order savedOrder = orderRepository.save(order);

        // Create order items after order is saved and has ID
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
            orderItem.setOrder(savedOrder); // Use saved order with ID
            orderItem.setProduct(product);
            orderItem.setQuantity(quantity);
            orderItem.setPriceAtOrder(Double.parseDouble(item.get("price").toString()));
            
            // Save each order item individually
            OrderItem savedOrderItem = orderItemRepository.save(orderItem);
            orderItems.add(savedOrderItem);
        }

        // Set order items to saved order
        savedOrder.setOrderItems(orderItems);

        // Handle rush order details if applicable
        if ("rush".equals(orderData.get("deliveryMethod")) && orderData.containsKey("rushOrderDetails")) {
            createRushOrderDetails(savedOrder, (Map<String, Object>) orderData.get("rushOrderDetails"));
        }

        // Send email confirmation without throwing exception
        emailService.sendOrderConfirmation(savedOrder);
        logger.info("Order created: {}", savedOrder.getOrderId());
        return savedOrder;
    }

    public Order createOrderFromCart(String sessionId, Map<String, Object> orderData) {
        logger.info("Creating order from cart: sessionId={}", sessionId);
        Cart cart = cartRepository.findById(sessionId)
                .orElseThrow(() -> {
                    logger.error("Cart not found: {}", sessionId);
                    return new RuntimeException("Cart not found");
                });

        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            logger.error("Cart is empty: {}", sessionId);
            throw new RuntimeException("Cart is empty");
        }

        // Validate stock availability before creating order
        validateStockAvailability(cart.getCartItems());

        // Build order from data
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

        // Save order first to get ID
        Order savedOrder = orderRepository.save(order);

        // Create order items after order is saved and has ID
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cart.getCartItems()) {
            Product product = cartItem.getProduct();
            int quantity = cartItem.getQuantity();
            
            if (quantity <= 0 || quantity > product.getQuantity()) {
                logger.error("Invalid quantity for product {}: requested {}, available {}", 
                    product.getBarcode(), quantity, product.getQuantity());
                throw new RuntimeException("Invalid quantity for product: " + product.getTitle());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder); // Use saved order with ID
            orderItem.setProduct(product);
            orderItem.setQuantity(quantity);
            orderItem.setPriceAtOrder(product.getPrice());
            
            // Save each order item individually
            OrderItem savedOrderItem = orderItemRepository.save(orderItem);
            orderItems.add(savedOrderItem);
        }

        // Set order items to saved order
        savedOrder.setOrderItems(orderItems);

        // Handle rush order details if applicable
        if ("rush".equals(orderData.get("deliveryMethod")) && orderData.containsKey("rushOrderDetails")) {
            createRushOrderDetails(savedOrder, (Map<String, Object>) orderData.get("rushOrderDetails"));
        }

        // Update product quantities
        updateProductQuantities(cart.getCartItems());

        // Clear cart after order creation
        cart.getCartItems().clear();
        cartRepository.save(cart);
        logger.info("Cleared cart: {}", sessionId);

        // Send email confirmation without throwing exception
        emailService.sendOrderConfirmation(savedOrder);
        logger.info("Order created from cart: {}", savedOrder.getOrderId());
        return savedOrder;
    }

    private void validateStockAvailability(Set<CartItem> cartItems) {
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            if (cartItem.getQuantity() > product.getQuantity()) {
                logger.error("Insufficient stock for product {}: requested {}, available {}", 
                    product.getBarcode(), cartItem.getQuantity(), product.getQuantity());
                throw new RuntimeException("Insufficient stock for product: " + product.getTitle() + 
                    ". Requested: " + cartItem.getQuantity() + ", Available: " + product.getQuantity());
            }
        }
    }

    private void updateProductQuantities(Set<CartItem> cartItems) {
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            int newQuantity = product.getQuantity() - cartItem.getQuantity();
            product.setQuantity(newQuantity);
            productRepository.save(product);
            logger.info("Updated product {} quantity: {} -> {}", 
                product.getBarcode(), product.getQuantity() + cartItem.getQuantity(), newQuantity);
        }
    }

    private void createRushOrderDetails(Order order, Map<String, Object> rushDetails) {
        try {
            RushOrderDetail rushOrderDetail = new RushOrderDetail();
            rushOrderDetail.setOrder(order);
            rushOrderDetail.setOrderId(order.getOrderId());
            
            // Parse delivery time
            String deliveryTimeStr = (String) rushDetails.get("deliveryTime");
            if (deliveryTimeStr != null && !deliveryTimeStr.isEmpty()) {
                // Handle both datetime-local format and time-only format
                if (deliveryTimeStr.contains("T")) {
                    // Full datetime format: 2023-12-25T14:30
                    String timeOnly = deliveryTimeStr.substring(deliveryTimeStr.indexOf("T") + 1);
                    rushOrderDetail.setDeliveryTime(LocalTime.parse(timeOnly));
                } else if (deliveryTimeStr.contains(":")) {
                    // Time only format: 14:30
                    rushOrderDetail.setDeliveryTime(LocalTime.parse(deliveryTimeStr));
                }
            }
            
            rushOrderDetail.setDeliveryInstructions((String) rushDetails.get("deliveryInstructions"));
            rushOrderDetailRepository.save(rushOrderDetail);
            
            logger.info("Created rush order details for order: {}", order.getOrderId());
        } catch (Exception e) {
            logger.error("Error creating rush order details for order {}: {}", order.getOrderId(), e.getMessage());
            // Don't fail the entire order creation for rush order details issues
        }
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
        vnpParams.put("vnp_Amount", String.valueOf((long) (order.getTotalAmount() * 100))); // Convert to cents
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", String.valueOf(order.getOrderId()));
        vnpParams.put("vnp_OrderInfo", "AIMS Payment for Order #" + order.getOrderId() + " - " + order.getCustomerName());
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnp_ReturnUrl);
        vnpParams.put("vnp_IpAddr", "127.0.0.1");

        // Add creation time
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
        sdf.setTimeZone(TimeZone.getTimeZone("GMT+7"));
        vnpParams.put("vnp_CreateDate", sdf.format(new Date()));
        
        // Add expiration time (15 minutes from now)
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.MINUTE, 15);
        vnpParams.put("vnp_ExpireDate", sdf.format(cal.getTime()));

        // Build query string
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
        
        // Remove trailing &
        if (hashData.length() > 0) {
            hashData.setLength(hashData.length() - 1);
        }
        if (query.length() > 0) {
            query.setLength(query.length() - 1);
        }

        // Generate secure hash
        String vnpSecureHash = hmacSHA512(vnp_SecretKey, hashData.toString());
        query.append("&vnp_SecureHash=").append(vnpSecureHash);

        String paymentUrl = vnp_Url + "?" + query.toString();
        logger.info("Payment URL generated for order: {}", order.getOrderId());
        return paymentUrl;
    }

    public boolean verifyPaymentSignature(Map<String, String> params, String receivedSecureHash) {
        logger.info("Verifying VNPay payment signature for transaction: {}", params.get("vnp_TxnRef"));
        try {
            // Remove vnp_SecureHash and vnp_SecureHashType from params
            Map<String, String> sortedParams = new TreeMap<>();
            for (Map.Entry<String, String> entry : params.entrySet()) {
                if (!entry.getKey().equals("vnp_SecureHash") && !entry.getKey().equals("vnp_SecureHashType")) {
                    if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                        sortedParams.put(entry.getKey(), entry.getValue());
                    }
                }
            }

            // Build hash data
            StringBuilder hashData = new StringBuilder();
            for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
                hashData.append(entry.getKey()).append("=")
                        .append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8)).append("&");
            }
            
            if (hashData.length() > 0) {
                hashData.setLength(hashData.length() - 1);
            }

            String computedHash = hmacSHA512(vnp_SecretKey, hashData.toString());
            boolean isValid = computedHash.equalsIgnoreCase(receivedSecureHash);
            
            logger.info("Signature verification {} for transaction: {}", 
                isValid ? "successful" : "failed", params.get("vnp_TxnRef"));
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

    public Order getOrderById(Integer orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
    }

    public void updateOrderStatus(Integer orderId, String status) {
        Order order = getOrderById(orderId);
        order.setStatus(status);
        orderRepository.save(order);
        logger.info("Updated order {} status to: {}", orderId, status);
    }
}