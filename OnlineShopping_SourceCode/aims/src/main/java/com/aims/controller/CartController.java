package com.aims.controller;

import com.aims.dto.CartDTO;
import com.aims.dto.CartDTO.CartItemDTO;
import com.aims.model.Cart;
import com.aims.model.Product;
import com.aims.service.CartService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/carts")
public class CartController {

    private static final Logger logger = LoggerFactory.getLogger(CartController.class);

    @Autowired
    private CartService cartService;

    // Thêm sản phẩm vào giỏ
    @PostMapping("/{sessionId}/items")
    @ResponseBody
    public ResponseEntity<CartDTO> addToCart(@PathVariable String sessionId,
                                             @RequestBody Map<String, Object> requestBody) {
        try {
            if (requestBody == null || !requestBody.containsKey("barcode") || !requestBody.containsKey("quantity")) {
                logger.warn("Invalid request body for addToCart: {}", requestBody);
                return ResponseEntity.badRequest().body(new CartDTO("error", "Missing barcode or quantity"));
            }

            String barcode = (String) requestBody.get("barcode");
            if (barcode == null || barcode.trim().isEmpty()) {
                logger.warn("Invalid barcode for sessionId: {}", sessionId);
                return ResponseEntity.badRequest().body(new CartDTO("error", "Invalid barcode"));
            }

            int quantity;
            try {
                quantity = Integer.parseInt(requestBody.get("quantity").toString());
            } catch (NumberFormatException e) {
                logger.warn("Invalid quantity format for sessionId: {}, barcode: {}", sessionId, barcode);
                return ResponseEntity.badRequest().body(new CartDTO("error", "Invalid quantity format"));
            }

            logger.info("Adding to cart - sessionId: {}, barcode: {}, quantity: {}", sessionId, barcode, quantity);
            Cart cart = cartService.addToCart(sessionId, barcode, quantity);
            CartDTO cartDTO = convertToCartDTO(cart);
            return ResponseEntity.ok(cartDTO);
        } catch (IllegalArgumentException e) {
            logger.error("Error adding to cart for sessionId: {}, barcode: {}. Message: {}",
                    sessionId, requestBody.get("barcode"), e.getMessage());
            return ResponseEntity.badRequest().body(new CartDTO("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error adding to cart for sessionId: {}", sessionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new CartDTO("error", "Internal server error"));
        }
    }

    // Lấy dữ liệu giỏ hàng
    @GetMapping("/{sessionId}")
    @ResponseBody
    public ResponseEntity<CartDTO> getCart(@PathVariable String sessionId) {
        try {
            logger.info("Fetching cart for sessionId: {}", sessionId);
            Cart cart = cartService.getCartWithStockCheck(sessionId);
            CartDTO cartDTO = convertToCartDTO(cart);
            return ResponseEntity.ok(cartDTO);
        } catch (IllegalArgumentException e) {
            logger.error("Error fetching cart for sessionId: {}. Message: {}", sessionId, e.getMessage());
            return ResponseEntity.badRequest().body(new CartDTO("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error fetching cart for sessionId: {}", sessionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new CartDTO("error", "Internal server error"));
        }
    }

    // Kiểm tra tồn kho
    @GetMapping("/{sessionId}/check-stock")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> checkStock(@PathVariable String sessionId) {
        try {
            logger.info("Checking stock for sessionId: {}", sessionId);
            Map<String, Integer> deficiencies = cartService.checkStockDeficiency(sessionId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", deficiencies.isEmpty());
            response.put("deficiencies", deficiencies);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error checking stock for sessionId: {}", sessionId, e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Xóa sản phẩm khỏi giỏ
    @DeleteMapping("/{sessionId}/items/{barcode}")
    @ResponseBody
    public ResponseEntity<CartDTO> removeFromCart(@PathVariable String sessionId,
                                                  @PathVariable String barcode) {
        try {
            logger.info("Removing item from cart - sessionId: {}, barcode: {}", sessionId, barcode);
            Cart cart = cartService.removeFromCart(sessionId, barcode);
            CartDTO cartDTO = convertToCartDTO(cart);
            return ResponseEntity.ok(cartDTO);
        } catch (IllegalArgumentException e) {
            logger.error("Error removing item from cart for sessionId: {}, barcode: {}. Message: {}",
                    sessionId, barcode, e.getMessage());
            return ResponseEntity.badRequest().body(new CartDTO("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error removing item from cart for sessionId: {}", sessionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new CartDTO("error", "Internal server error"));
        }
    }

    // Xóa toàn bộ giỏ hàng
    @DeleteMapping("/clear/{sessionId}")
    @ResponseBody
    public ResponseEntity<CartDTO> clearCart(@PathVariable String sessionId) {
        try {
            logger.info("Clearing cart for sessionId: {}", sessionId);
            Cart cart = cartService.clearCart(sessionId);
            CartDTO cartDTO = convertToCartDTO(cart);
            return ResponseEntity.ok(cartDTO);
        } catch (Exception e) {
            logger.error("Unexpected error clearing cart for sessionId: {}", sessionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new CartDTO("error", "Internal server error"));
        }
    }

    // Chuyển đổi Cart sang CartDTO
    private CartDTO convertToCartDTO(Cart cart) {
        double totalPrice = cart.getCartItems().stream()
                .mapToDouble(item -> item.getProduct().getPrice() * item.getQuantity())
                .sum();

        Set<CartItemDTO> cartItemDTOs = cart.getCartItems().stream().map(item -> {
            Product product = item.getProduct();
            return new CartItemDTO(
                    item.getBarcode(),
                    product.getTitle(),
                    item.getQuantity(),
                    product.getPrice(),
                    product.isRushDelivery()
            );
        }).collect(Collectors.toSet());

        Map<String, Integer> deficiencies = cartService.checkStockDeficiency(cart.getSessionId());

        return new CartDTO(
                cart.getSessionId(),
                cartItemDTOs,
                totalPrice,
                deficiencies,
                "success",
                null
        );
    }
}