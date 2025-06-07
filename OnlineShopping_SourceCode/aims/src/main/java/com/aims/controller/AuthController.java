package com.aims.controller;

import com.aims.config.JwtAuthenticationFilter;
import com.aims.model.User;
import com.aims.repository.UserRepository;
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
    private JwtAuthenticationFilter jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

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

        logger.info("Login attempt for email: {}", email);
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

        if (role == null || !role.equalsIgnoreCase(requestedRole)) {
            logger.warn("Invalid role for email: {}, requested: {}", email, requestedRole);
            return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "Only Product Manager or Admin can login with specified role"
            ));
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtUtil.generateToken(userDetails);

        logger.info("Login successful for email: {}", email);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("token", token);
        response.put("role", role);
        return ResponseEntity.ok(response);
    }
}