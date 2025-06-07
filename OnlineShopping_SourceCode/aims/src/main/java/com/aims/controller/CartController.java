 package com.aims.controller;

 import com.aims.model.Cart;
 import com.aims.service.CartService;
 import org.slf4j.Logger;
 import org.slf4j.LoggerFactory;
 import org.springframework.beans.factory.annotation.Autowired;
 import org.springframework.http.ResponseEntity;
 import org.springframework.web.bind.annotation.*;

 import java.util.HashMap;
 import java.util.List;
 import java.util.Map;
 import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    private static final Logger logger = LoggerFactory.getLogger(CartController.class);

    @Autowired
    private CartService cartService;

    @PostMapping("/add")
    public ResponseEntity<Map<String, Object>> addToCart(
            @RequestParam String sessionId,
            @RequestParam String barcode,
            @RequestParam int quantity) {
        logger.info("Adding product {} to cart {} with quantity {}", barcode, sessionId, quantity);
        try {
            Cart cart = cartService.addToCart(sessionId, barcode, quantity);
            return ResponseEntity.ok(buildCartResponse(cart));
        } catch (IllegalArgumentException e) {
            logger.warn("Error adding to cart: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            logger.error("Unexpected error adding to cart: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "Internal server error"
            ));
        }
    }

    @PostMapping("/remove")
    public ResponseEntity<Map<String, Object>> removeFromCart(
            @RequestParam String sessionId,
            @RequestParam String barcode) {
        logger.info("Removing product {} from cart {}", barcode, sessionId);
        try {
            Cart cart = cartService.removeFromCart(sessionId, barcode);
            return ResponseEntity.ok(buildCartResponse(cart));
        } catch (IllegalArgumentException e) {
            logger.warn("Error removing from cart: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            logger.error("Unexpected error removing from cart: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "Internal server error"
            ));
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getCart(@RequestParam String sessionId) {
        logger.info("Fetching cart for session: {}", sessionId);
        try {
            Cart cart = cartService.getOrCreateCart(sessionId);
            return ResponseEntity.ok(buildCartResponse(cart));
        } catch (Exception e) {
            logger.error("Error fetching cart: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "Internal server error"
            ));
        }
    }

    @PostMapping("/clear")
    public ResponseEntity<Map<String, Object>> clearCart(@RequestParam String sessionId) {
        logger.info("Clearing cart for session: {}", sessionId);
        try {
            cartService.clearCart(sessionId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Cart cleared successfully"
            ));
        } catch (IllegalArgumentException e) {
            logger.warn("Error clearing cart: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            logger.error("Unexpected error clearing cart: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "Internal server error"
            ));
        }
    }

    private Map<String, Object> buildCartResponse(Cart cart) {
        List<Map<String, Object>> items = cart.getCartItems().stream().map(cartItem -> {
            Map<String, Object> item = new HashMap<>();
            item.put("barcode", cartItem.getProduct().getBarcode());
            item.put("title", cartItem.getProduct().getTitle()); // Sửa từ getName() thành getTitle()
            item.put("quantity", cartItem.getQuantity());
            item.put("price", cartItem.getProduct().getPrice());
            item.put("total", cartItem.getQuantity() * cartItem.getProduct().getPrice());
            return item;
        }).collect(Collectors.toList());

        double totalAmount = items.stream()
                .mapToDouble(item -> (double) item.get("total"))
                .sum();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("sessionId", cart.getSessionId());
        response.put("items", items);
        response.put("totalAmount", totalAmount);
        return response;
    }
}