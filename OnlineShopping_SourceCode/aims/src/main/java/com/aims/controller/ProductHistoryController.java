package com.aims.controller;

import com.aims.model.ProductHistory;
import com.aims.model.User;
import com.aims.service.ProductHistoryService;
import com.aims.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/product-history")
public class ProductHistoryController {
    private static final Logger logger = LoggerFactory.getLogger(ProductHistoryController.class);

    @Autowired
    private ProductHistoryService productHistoryService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Lấy tất cả lịch sử operations
     */
    @GetMapping
    public ResponseEntity<Page<ProductHistory>> getAllHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "operationDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        logger.info("[GET /api/product-history] Fetching all history - page={}, size={}", page, size);
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") ?
                    Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);

            Page<ProductHistory> history = productHistoryService.getAllHistory(pageable);
            logger.info("→ Found {} history records", history.getTotalElements());
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("✖ Error while fetching history", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Lấy lịch sử theo barcode
     */
    @GetMapping("/product/{barcode}")
    public ResponseEntity<Page<ProductHistory>> getHistoryByBarcode(
            @PathVariable String barcode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        logger.info("[GET /api/product-history/product/{}] Fetching history for barcode", barcode);
        try {
            Pageable pageable = PageRequest.of(page, size,
                    Sort.by("operationDate").descending());

            Page<ProductHistory> history = productHistoryService.getHistoryByBarcode(barcode, pageable);
            logger.info("→ Found {} history records for barcode: {}", history.getTotalElements(), barcode);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("✖ Error while fetching history for barcode: {}", barcode, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Lấy lịch sử của user hiện tại
     */
    @GetMapping("/my-history")
    public ResponseEntity<Page<ProductHistory>> getMyHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        logger.info("[GET /api/product-history/my-history] Fetching history for current user");
        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                logger.warn("⚠ No authenticated user found");
                return ResponseEntity.status(401).build();
            }

            Pageable pageable = PageRequest.of(page, size,
                    Sort.by("operationDate").descending());

            Page<ProductHistory> history = productHistoryService.getHistoryByUser(currentUser, pageable);
            logger.info("→ Found {} history records for user: {}", history.getTotalElements(), currentUser.getEmail());
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("✖ Error while fetching user history", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Lấy lịch sử theo user ID
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<ProductHistory>> getHistoryByUserId(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        logger.info("[GET /api/product-history/user/{}] Fetching history for user ID", userId);
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                logger.warn("⚠ User not found: {}", userId);
                return ResponseEntity.notFound().build();
            }

            Pageable pageable = PageRequest.of(page, size,
                    Sort.by("operationDate").descending());

            Page<ProductHistory> history = productHistoryService.getHistoryByUser(userOpt.get(), pageable);
            logger.info("→ Found {} history records for user ID: {}", history.getTotalElements(), userId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("✖ Error while fetching history for user ID: {}", userId, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Lấy thống kê tóm tắt
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        logger.info("[GET /api/product-history/statistics] Fetching history statistics");
        try {
            User currentUser = getCurrentUser();
            Map<String, Object> stats = new HashMap<>();

            if (currentUser != null) {
                stats.put("userEmail", currentUser.getEmail());
                stats.put("todayOperations", productHistoryService.countTodayOperations());
                stats.put("totalOperations", "Feature coming soon");
            } else {
                stats.put("message", "No authenticated user");
            }

            logger.info("→ Statistics retrieved");
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("✖ Error while fetching statistics", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Lấy user hiện tại từ Security Context
     */
    private User getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                    !authentication.getName().equals("anonymousUser")) {
                String email = authentication.getName();
                Optional<User> userOpt = userRepository.findByEmail(email);
                return userOpt.orElse(null);
            }
        } catch (Exception e) {
            logger.error("Failed to get current user", e);
        }
        return null;
    }
}