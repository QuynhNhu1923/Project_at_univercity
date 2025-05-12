package com.aims.service;

import com.aims.model.Order;
import com.aims.model.OrderItem;
import com.aims.model.Product;
import com.aims.repository.OrderRepository;
import com.aims.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    public Order createOrder(Map<String, Object> orderData) {
        Order order = new Order();
        order.setCustomerName((String) orderData.get("customerName"));
        order.setEmail((String) orderData.get("email"));
        order.setPhone((String) orderData.get("phone"));
        order.setProvinceCity((String) orderData.get("provinceCity"));
        order.setDeliveryAddress((String) orderData.get("deliveryAddress"));
        order.setDeliveryMethod((String) orderData.get("deliveryMethod"));
        order.setDeliveryFee(Double.parseDouble(orderData.get("deliveryFee").toString()));
        order.setTotalAmount(Double.parseDouble(orderData.get("totalAmount").toString()));

        List<Map<String, Object>> items = (List<Map<String, Object>>) orderData.get("items");
        for (Map<String, Object> item : items) {
            OrderItem orderItem = new OrderItem();
            Product product = productRepository.findById((String) item.get("barcode")).orElse(null);
            if (product == null) {
                throw new RuntimeException("Product not found");
            }
            orderItem.setProduct(product);
            orderItem.setQuantity(Integer.parseInt(item.get("quantity").toString()));
            orderItem.setPriceAtOrder(Double.parseDouble(item.get("price").toString()));
            order.getOrderItems().add(orderItem);
        }

        return orderRepository.save(order);
    }

    public String createPaymentUrl(Order order) throws Exception {
        String vnp_TmnCode = "YOUR_TMN_CODE";
        String vnp_SecretKey = "YOUR_SECRET_KEY";
        String vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        String vnp_ReturnUrl = "http://localhost:8080/api/orders/payment-callback";

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf((int) (order.getTotalAmount() * 100)));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", String.valueOf(order.getOrderId()));
        vnp_Params.put("vnp_OrderInfo", "Payment for order " + order.getOrderId());
        vnp_Params.put("vnp_OrderType", "billpayment");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", "127.0.0.1");
        vnp_Params.put("vnp_CreateDate", String.valueOf(System.currentTimeMillis()));

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        for (String fieldName : fieldNames) {
            String fieldValue = vnp_Params.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName).append("=").append(fieldValue).append("&");
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8))
                        .append("=")
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8))
                        .append("&");
            }
        }
        hashData.setLength(hashData.length() - 1); // Remove last "&"
        query.setLength(query.length() - 1); // Remove last "&"

        String vnp_SecureHash = hmacSHA512(vnp_SecretKey, hashData.toString());
        query.append("&vnp_SecureHash=").append(vnp_SecureHash);

        return vnp_Url + "?" + query.toString();
    }

    private String hmacSHA512(String key, String data) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-512");
        byte[] hash = md.digest((key + data).getBytes(StandardCharsets.UTF_8));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}