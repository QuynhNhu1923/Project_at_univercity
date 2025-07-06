package com.aims.controller;

import com.aims.model.User;
import com.aims.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;

    // Lấy danh sách tất cả người dùng
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        logger.info("Fetched {} users", users.size());
        return ResponseEntity.ok(users);
    }

    // Thêm hoặc cập nhật người dùng
    @PostMapping
    public ResponseEntity<String> createOrUpdateUser(@RequestBody User user) {
        try {
            Optional<User> existingUser = userRepository.findByEmail(user.getEmail());
            if (existingUser.isPresent()) {
                User updateUser = existingUser.get();
                //updateUser.setName(user.getName());
                updateUser.setRoles(user.getRoles());
                userRepository.save(updateUser);
                logger.info("Updated user: {}", user.getEmail());
            } else {
                user.setPassword("defaultPassword"); // Mật khẩu mặc định plaintext
                user.setStatus("active");
                userRepository.save(user);
                logger.info("Created user: {}", user.getEmail());
            }
            sendNotification(user.getEmail(), "updated");
            return ResponseEntity.ok("User added/updated successfully");
        } catch (Exception e) {
            logger.error("Error creating/updating user: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to add/update user");
        }
    }

    // Khóa tài khoản
    @PutMapping("/{userId}/block")
    public ResponseEntity<String> blockUser(@PathVariable Integer userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) {
            logger.warn("User not found: {}", userId);
            return ResponseEntity.status(404).body("User not found");
        }
        User existingUser = user.get();
        existingUser.setStatus("blocked");
        userRepository.save(existingUser);
        sendNotification(existingUser.getEmail(), "blocked");
        logger.info("Blocked user: {}", userId);
        return ResponseEntity.ok("User blocked successfully");
    }

    // Mở khóa tài khoản
    @PutMapping("/{userId}/unblock")
    public ResponseEntity<String> unblockUser(@PathVariable Integer userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) {
            logger.warn("User not found: {}", userId);
            return ResponseEntity.status(404).body("User not found");
        }
        User existingUser = user.get();
        existingUser.setStatus("active");
        userRepository.save(existingUser);
        sendNotification(existingUser.getEmail(), "unblocked");
        logger.info("Unblocked user: {}", userId);
        return ResponseEntity.ok("User unblocked successfully");
    }

    // Xóa tài khoản
    @DeleteMapping("/{userId}")
    public ResponseEntity<String> deleteUser(@PathVariable Integer userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) {
            logger.warn("User not found: {}", userId);
            return ResponseEntity.status(404).body("User not found");
        }
        String email = user.get().getEmail();
        userRepository.deleteById(userId);
        sendNotification(email, "deleted");
        logger.info("Deleted user: {}", userId);
        return ResponseEntity.ok("User deleted successfully");
    }

    // Reset mật khẩu
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isEmpty()) {
            logger.warn("User not found: {}", email);
            return ResponseEntity.status(404).body("User not found");
        }
        String newPassword = UUID.randomUUID().toString().substring(0, 8); // Mật khẩu tạm plaintext
        user.get().setPassword(newPassword);
        userRepository.save(user.get());
        sendNotification(email, "password_reset", newPassword);
        logger.info("Password reset for user: {}", email);
        return ResponseEntity.ok("Password reset successfully");
    }

    // Gửi email thông báo
    @PostMapping("/notify")
    public ResponseEntity<String> notifyUser(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String action = request.get("action");
        sendNotification(email, action);
        logger.info("Notification sent to {} for action: {}", email, action);
        return ResponseEntity.ok("Notification sent successfully");
    }

    private void sendNotification(String email, String action, String... params) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        switch (action) {
            case "updated":
                message.setSubject("AIMS Account Updated");
                message.setText("Your account has been updated.");
                break;
            case "blocked":
                message.setSubject("AIMS Account Blocked");
                message.setText("Your account has been blocked.");
                break;
            case "unblocked":
                message.setSubject("AIMS Account Unblocked");
                message.setText("Your account has been unblocked.");
                break;
            case "deleted":
                message.setSubject("AIMS Account Deleted");
                message.setText("Your account has been deleted.");
                break;
            case "password_reset":
                message.setSubject("AIMS Password Reset");
                message.setText("Your new password is: " + params[0] + "\nPlease change it after logging in.");
                break;
            default:
                return;
        }
        try {
            mailSender.send(message);
            logger.info("Email sent to {} for action: {}", email, action);
        } catch (Exception e) {
            logger.error("Failed to send email to {}: {}", email, e.getMessage());
        }
    }
}