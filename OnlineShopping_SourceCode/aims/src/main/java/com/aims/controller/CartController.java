package com.aims.controller;

import com.aims.dto.CartDTO;
import com.aims.service.CartService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/carts")
public class CartController {

    private static final Logger logger = LoggerFactory.getLogger(CartController.class);

    @Autowired
    private CartService cartService;

    @GetMapping("/{sessionId}")
    public ResponseEntity<CartDTO> getCart(@PathVariable String sessionId) {
        logger.info("Fetching cart for sessionId: {}", sessionId);
        try {
            CartDTO cartDTO = cartService.getCartWithStockCheckDTO(sessionId);
            return ResponseEntity.ok(cartDTO);
        } catch (Exception e) {
            logger.error("Error fetching cart for sessionId: {}", sessionId, e);
            return ResponseEntity.badRequest().body(new CartDTO(sessionId, null, 0.0, null, "ERROR", e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/items")
    public ResponseEntity<CartDTO> addToCart(
            @PathVariable String sessionId,
            @RequestBody CartItemRequest request) {
        logger.info("Adding to cart - sessionId: {}, barcode: {}, quantity: {}", sessionId, request.getBarcode(), request.getQuantity());
        try {
            if (request.getBarcode() == null || request.getBarcode().trim().isEmpty()) {
                throw new IllegalArgumentException("Barcode cannot be empty");
            }
            if (request.getQuantity() <= 0) {
                throw new IllegalArgumentException("Quantity must be greater than 0");
            }
            CartDTO cartDTO = cartService.addToCartDTO(sessionId, request.getBarcode(), request.getQuantity());
            return ResponseEntity.ok(cartDTO);
        } catch (Exception e) {
            logger.error("Error adding to cart for sessionId: {}, barcode: {}", sessionId, request.getBarcode(), e);
            return ResponseEntity.badRequest().body(new CartDTO(sessionId, null, 0.0, null, "ERROR", e.getMessage()));
        }
    }

    @DeleteMapping("/{sessionId}/items/{barcode}")
    public ResponseEntity<CartDTO> removeFromCart(
            @PathVariable String sessionId,
            @PathVariable String barcode) {
        logger.info("Removing from cart - sessionId: {}, barcode: {}", sessionId, barcode);
        try {
            if (barcode == null || barcode.trim().isEmpty()) {
                throw new IllegalArgumentException("Barcode cannot be empty");
            }
            CartDTO cartDTO = cartService.removeFromCartDTO(sessionId, barcode);
            return ResponseEntity.ok(cartDTO);
        } catch (Exception e) {
            logger.error("Error removing from cart for sessionId: {}, barcode: {}", sessionId, barcode, e);
            return ResponseEntity.badRequest().body(new CartDTO(sessionId, null, 0.0, null, "ERROR", e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/clear")
    public ResponseEntity<CartDTO> clearCart(@PathVariable String sessionId) {
        logger.info("Clearing cart for sessionId: {}", sessionId);
        try {
            CartDTO cartDTO = cartService.clearCartDTO(sessionId);
            return ResponseEntity.ok(cartDTO);
        } catch (Exception e) {
            logger.error("Error clearing cart for sessionId: {}", sessionId, e);
            return ResponseEntity.badRequest().body(new CartDTO(sessionId, null, 0.0, null, "ERROR", e.getMessage()));
        }
    }
}

class CartItemRequest {
    private String barcode;
    private int quantity;

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}