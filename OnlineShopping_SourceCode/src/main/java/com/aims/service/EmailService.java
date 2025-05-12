package com.aims.service;

import com.aims.model.Order;
import com.aims.model.OrderItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOrderConfirmation(Order order) {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper;
        try {
            helper = new MimeMessageHelper(message, true);
            helper.setTo(order.getEmail());
            helper.setSubject("Order Confirmation - Order #" + order.getOrderId());

            StringBuilder emailContent = new StringBuilder();
            emailContent.append("<h1>Order Confirmation</h1>")
                    .append("<p>Dear ").append(order.getCustomerName()).append(",</p>")
                    .append("<p>Thank you for your order! Here are the details:</p>")
                    .append("<p><strong>Order ID:</strong> ").append(order.getOrderId()).append("</p>")
                    .append("<p><strong>Delivery Address:</strong> ").append(order.getDeliveryAddress()).append(", ")
                    .append(order.getProvinceCity()).append("</p>")
                    .append("<p><strong>Delivery Method:</strong> ").append(order.getDeliveryMethod()).append("</p>")
                    .append("<p><strong>Total Amount:</strong> ").append(order.getTotalAmount()).append(" VND</p>")
                    .append("<h2>Items:</h2>")
                    .append("<ul>");

            for (OrderItem item : order.getOrderItems()) {
                emailContent.append("<li>")
                        .append(item.getProduct().getTitle())
                        .append(" - Quantity: ").append(item.getQuantity())
                        .append(" - Price: ").append(item.getPriceAtOrder()).append(" VND")
                        .append("</li>");
            }
            emailContent.append("</ul>")
                    .append("<p>We will notify you once your order is shipped.</p>")
                    .append("<p>Best regards,<br>AIMS Team</p>");

            helper.setText(emailContent.toString(), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }
}