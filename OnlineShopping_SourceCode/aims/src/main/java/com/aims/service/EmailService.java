package com.aims.service;

import com.aims.model.Order;
import com.aims.model.OrderItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    public void sendOrderConfirmation(Order order) {
        if (order == null || order.getEmail() == null || order.getEmail().isEmpty()) {
            logger.error("Invalid order or email for confirmation");
            return; // Không ném exception
        }

        logger.info("Preparing order confirmation email for order: {}", order.getOrderId());
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(order.getEmail());
            helper.setSubject("AIMS - Order Confirmation #" + order.getOrderId());

            StringBuilder emailContent = new StringBuilder();
            emailContent.append("<h1>Order Confirmation</h1>")
                    .append("<p>Dear ").append(order.getCustomerName()).append(",</p>")
                    .append("<p>Thank you for shopping with AIMS! Your order details are below:</p>")
                    .append("<p><strong>Order ID:</strong> ").append(order.getOrderId()).append("</p>")
                    .append("<p><strong>Delivery Address:</strong> ").append(order.getDeliveryAddress())
                    .append(", ").append(order.getProvinceCity()).append("</p>")
                    .append("<p><strong>Delivery Method:</strong> ").append(order.getDeliveryMethod()).append("</p>")
                    .append("<p><strong>Total Amount:</strong> ").append(String.format("%.2f", order.getTotalAmount())).append(" VND</p>")
                    .append("<h2>Order Items:</h2>");

            if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
                logger.warn("No items in order: {}", order.getOrderId());
                emailContent.append("<p>No items found in this order.</p>");
            } else {
                emailContent.append("<ul>");
                for (OrderItem item : order.getOrderItems()) {
                    emailContent.append("<li>")
                            .append(item.getProduct().getTitle())
                            .append(" (x").append(item.getQuantity()).append(")")
                            .append(" - ").append(String.format("%.2f", item.getPriceAtOrder())).append(" VND")
                            .append("</li>");
                }
                emailContent.append("</ul>");
            }

            emailContent.append("<p>You will be notified when your order is shipped.</p>")
                    .append("<p>Best regards,<br>AIMS Team</p>");

            helper.setText(emailContent.toString(), true);
            mailSender.send(message);
            logger.info("Order confirmation email sent to: {}", order.getEmail());
            
        } catch (Exception e) {
            // Log lỗi nhưng KHÔNG ném exception để không block việc tạo order
            logger.error("Failed to send confirmation email for order {}: {}", order.getOrderId(), e.getMessage());
            logger.info("Order created successfully despite email failure");
            // KHÔNG throw exception ở đây
        }
    }

    public void sendNotification(String email, String action, String... params) throws MessagingException {
        if (email == null || email.isEmpty()) {
            logger.error("Invalid email for notification");
            throw new IllegalArgumentException("Invalid email");
        }

        logger.info("Preparing notification email for: {} (action: {})", email, action);
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        try {
            helper.setTo(email);
            String subject, content;
            switch (action) {
                case "updated":
                    subject = "AIMS Account Updated";
                    content = "<p>Your account information has been updated successfully.</p>";
                    break;
                case "blocked":
                    subject = "AIMS Account Blocked";
                    content = "<p>Your account has been blocked. Please contact support for assistance.</p>";
                    break;
                case "unblocked":
                    subject = "AIMS Account Unblocked";
                    content = "<p>Your account has been unblocked and is now active.</p>";
                    break;
                case "deleted":
                    subject = "AIMS Account Deleted";
                    content = "<p>Your account has been deleted from our system.</p>";
                    break;
                case "password_reset":
                    subject = "AIMS Password Reset";
                    content = "<p>Your password has been reset to: <strong>" + params[0] + "</strong></p>" +
                            "<p>Please change it after logging in.</p>";
                    break;
                case "order_cancelled":
                    subject = "AIMS Order Cancelled";
                    content = "<p>Your order #" + params[0] + " has been cancelled.</p>";
                    break;
                case "order_rejected":
                    subject = "AIMS Order Rejected";
                    content = "<p>Your order #" + params[0] + " has been rejected.</p>";
                    break;
                default:
                    logger.warn("Unsupported notification action: {}", action);
                    throw new IllegalArgumentException("Unsupported action: " + action);
            }

            helper.setSubject(subject);
            helper.setText("<h1>" + subject + "</h1>" + content + "<p>Best regards,<br>AIMS Team</p>", true);
            mailSender.send(message);
            logger.info("Notification email sent to: {} for action: {}", email, action);
        } catch (MessagingException e) {
            logger.error("Failed to send notification email to {}: {}", email, e.getMessage());
            throw e;
        }
    }
}