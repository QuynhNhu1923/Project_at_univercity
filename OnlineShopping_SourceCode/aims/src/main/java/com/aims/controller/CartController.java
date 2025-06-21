package com.aims.controller;
import com.aims.dto.CartDTO;
import com.aims.dto.CartDTO.CartItemDTO; // Import lớp nội bộ (nếu cần)
import com.aims.model.Cart;
import com.aims.service.CartService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/carts")
public class CartController {

    private static final Logger logger = LoggerFactory.getLogger(CartController.class);

    @Autowired
    private CartService cartService;

    // Lấy giỏ hàng hiện tại
    @GetMapping("/{sessionId}")
    public ResponseEntity<CartDTO> getCart(@PathVariable String sessionId) {
        Cart cart = cartService.getCart(sessionId);
        Set<CartItemDTO> cartItemDTOs = cart.getCartItems().stream()
                .map(item -> new CartItemDTO(item.getBarcode(), item.getQuantity()))
                .collect(Collectors.toSet());
        CartDTO cartDTO = new CartDTO(cart.getSessionId(), cartItemDTOs);
        return ResponseEntity.ok(cartDTO);
    }

    // Thêm sản phẩm vào giỏ
    @PostMapping("/{sessionId}/items")
    public ResponseEntity<CartDTO> addToCart(@PathVariable String sessionId,
                                             @RequestParam String barcode,
                                             @RequestParam int quantity) {
        logger.info("Received addToCart request - sessionId: {}, barcode: {}, quantity: {}", sessionId, barcode, quantity);
        Cart cart = cartService.addToCart(sessionId, barcode, quantity);
        Set<CartItemDTO> cartItemDTOs = cart.getCartItems().stream()
                .map(item -> new CartItemDTO(item.getBarcode(), item.getQuantity()))
                .collect(Collectors.toSet());
        CartDTO cartDTO = new CartDTO(cart.getSessionId(), cartItemDTOs);
        return ResponseEntity.ok(cartDTO);
    }

    // Xoá 1 sản phẩm khỏi giỏ
    @DeleteMapping("/remove")
    public ResponseEntity<CartDTO> removeFromCart(@RequestParam String sessionId,
                                                  @RequestParam String barcode) {
        Cart cart = cartService.removeFromCart(sessionId, barcode);
        Set<CartItemDTO> cartItemDTOs = cart.getCartItems().stream()
                .map(item -> new CartItemDTO(item.getBarcode(), item.getQuantity()))
                .collect(Collectors.toSet());
        CartDTO cartDTO = new CartDTO(cart.getSessionId(), cartItemDTOs);
        return ResponseEntity.ok(cartDTO);
    }

    // Xoá toàn bộ giỏ hàng
    @DeleteMapping("/clear/{sessionId}")
    public ResponseEntity<CartDTO> clearCart(@PathVariable String sessionId) {
        Cart cart = cartService.clearCart(sessionId);
        Set<CartItemDTO> cartItemDTOs = cart.getCartItems().stream()
                .map(item -> new CartItemDTO(item.getBarcode(), item.getQuantity()))
                .collect(Collectors.toSet());
        CartDTO cartDTO = new CartDTO(cart.getSessionId(), cartItemDTOs);
        return ResponseEntity.ok(cartDTO);
    }
}