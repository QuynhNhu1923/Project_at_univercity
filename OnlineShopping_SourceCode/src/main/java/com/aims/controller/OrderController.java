package com.aims.controller;

import com.aims.model.*;
import com.aims.repository.*;
import com.aims.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RushOrderDetailRepository rushOrderDetailRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private EmailService emailService;

    @GetMapping
    public Page<Order> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return orderRepository.findAll(pageable);
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> placeOrder(@RequestBody Map<String, Object> orderData) {
        Order order = new Order();
        order.setCustomerName((String) orderData.get("customerName"));
        order.setEmail((String) orderData.get("email"));
        order.setPhone((String) orderData.get("phone"));
        order.setProvinceCity((String) orderData.get("provinceCity"));
        order.setDeliveryAddress((String) orderData.get("deliveryAddress"));
        order.setDeliveryMethod((String) orderData.get("deliveryMethod"));
        order.setDeliveryFee(Double.parseDouble(orderData.get("deliveryFee").toString()));
        order.setTotalAmount(Double.parseDouble(orderData.get("totalAmount").toString()));

        Order savedOrder = orderRepository.save(order);

        List<Map<String, Object>> items = (List<Map<String, Object>>) orderData.get("items");
        for (Map<String, Object> item : items) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            Product product = productRepository.findById((String) item.get("barcode")).orElse(null);
            if (product == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Product not found"));
            }
            orderItem.setProduct(product);
            orderItem.setQuantity(Integer.parseInt(item.get("quantity").toString()));
            orderItem.setPriceAtOrder(Double.parseDouble(item.get("price").toString()));
            savedOrder.getOrderItems().add(orderItem);
        }
        orderRepository.save(savedOrder);

        if ("rush".equals(order.getDeliveryMethod())) {
            RushOrderDetail rushDetail = new RushOrderDetail();
            rushDetail.setOrder(savedOrder);
            String deliveryTimeStr = (String) orderData.get("deliveryTime");
            if (deliveryTimeStr != null && !deliveryTimeStr.isEmpty()) {
                try {
                    rushDetail.setDeliveryTime(LocalTime.parse(deliveryTimeStr));
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Invalid delivery time format"));
                }
            }
            rushDetail.setDeliveryInstructions((String) orderData.get("deliveryInstructions"));
            rushOrderDetailRepository.save(rushDetail);
        }

        Payment payment = new Payment();
        payment.setTransactionId("TX" + System.currentTimeMillis());
        payment.setOrder(savedOrder);
        payment.setAmount(savedOrder.getTotalAmount());
        payment.setStatus("pending");
        payment.setTransactionDatetime(LocalDateTime.now());
        payment.setTransactionContent("Payment for order " + savedOrder.getOrderId());
        paymentRepository.save(payment);

        emailService.sendOrderConfirmation(savedOrder);

        return ResponseEntity.ok(Map.of("paymentUrl", "https://sandbox.vnpayment.vn/"));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('PRODUCT_MANAGER')")
    public ResponseEntity<Void> approveOrder(@PathVariable Integer id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        order.setStatus("approved");
        orderRepository.save(order);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('PRODUCT_MANAGER')")
    public ResponseEntity<Void> rejectOrder(@PathVariable Integer id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        order.setStatus("rejected");
        orderRepository.save(order);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelOrder(@PathVariable Integer id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        if (!"pending".equals(order.getStatus())) {
            return ResponseEntity.badRequest().build();
        }
        order.setStatus("cancelled");
        orderRepository.save(order);
        return ResponseEntity.ok().build();
    }
}