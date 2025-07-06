package com.aims.controller;

import com.aims.model.User;
import com.aims.repository.UserRepository;
import com.aims.util.JwtUtil;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");
        String requestedRole = loginRequest.get("role");

        if (email == null || password == null || requestedRole == null) {
            logger.warn("Missing login credentials or role");
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email, password, and role are required"
            ));
        }

        logger.info("Login attempt for email: {}, requested role: {}", email, requestedRole);
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !password.equals(userOpt.get().getPassword())) {
            logger.warn("Invalid credentials for email: {}", email);
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Invalid email or password"
            ));
        }

        User user = userOpt.get();
        if (!"active".equals(user.getStatus())) {
            logger.warn("Blocked or inactive account: {}", email);
            return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "User account is blocked or inactive"
            ));
        }

        String role = user.getRoles().stream()
                .map(roleObj -> roleObj.getRoleName())
                .filter(r -> r.equals("PRODUCT_MANAGER") || r.equals("ADMIN"))
                .findFirst()
                .orElse(null);
        logger.info("User role from DB: {}, requested role: {}", role, requestedRole);

        // Chuẩn hóa role: loại bỏ dấu gạch dưới và chuyển thành chữ thường
        String normalizedRequestedRole = requestedRole.replaceAll("_", "").toLowerCase();
        String normalizedRole = role != null ? role.replaceAll("_", "").toLowerCase() : null;

        if (role == null || !normalizedRequestedRole.equals(normalizedRole)) {
            logger.warn("Invalid role for email: {}, requested: {}, db role: {}", email, requestedRole, role);
            return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "Only Product Manager or Admin can login with specified role"
            ));
        }

        // Đảm bảo UserDetailsService tải đúng role
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        if (userDetails == null) {
            logger.error("UserDetails not found for email: {}", email);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Internal server error"
            ));
        }

        String token = jwtUtil.generateToken(userDetails);
        logger.info("Login successful for email: {}, generated token: {}", email, token);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("token", token);
        response.put("role", role);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out successfully"));
    }
    @PostMapping("/anonymous")
    public ResponseEntity<Map<String, Object>> anonymousLogin() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("token", "anonymous-token"); // Token giả hoặc để trống
        response.put("role", "ANONYMOUS");
        return ResponseEntity.ok(response);
    }
}