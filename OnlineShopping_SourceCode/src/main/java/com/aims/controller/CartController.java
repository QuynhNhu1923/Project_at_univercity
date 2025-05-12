package com.aims.controller;

import com.aims.model.Cart;
import com.aims.model.CartItem;
import com.aims.model.Product;
import com.aims.repository.CartItemRepository;
import com.aims.repository.CartRepository;
import com.aims.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/carts")
public class CartController {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/{sessionId}")
    public ResponseEntity<Cart> getCart(@PathVariable String sessionId) {
        Optional<Cart> cart = cartRepository.findById(sessionId);
        if (cart.isPresent()) {
            return ResponseEntity.ok(cart.get());
        } else {
            Cart newCart = new Cart();
            newCart.setSessionId(sessionId);
            return ResponseEntity.ok(cartRepository.save(newCart));
        }
    }

    @PostMapping("/{sessionId}/items")
    public ResponseEntity<Cart> addToCart(
            @PathVariable String sessionId,
            @RequestBody Map<String, Object> itemData) {
        // Tìm hoặc tạo Cart
        Optional<Cart> cartOptional = cartRepository.findById(sessionId);
        Cart cart;
        if (cartOptional.isPresent()) {
            cart = cartOptional.get();
        } else {
            cart = new Cart();
            cart.setSessionId(sessionId);
            cart = cartRepository.save(cart);
        }

        // Lấy thông tin từ request body
        String barcode = (String) itemData.get("barcode");
        int quantity;
        try {
            quantity = Integer.parseInt(itemData.get("quantity").toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(null);
        }

        // Kiểm tra sản phẩm
        Product product = productRepository.findById(barcode).orElse(null);
        if (product == null) {
            return ResponseEntity.badRequest().body(null);
        }

        // Kiểm tra số lượng tồn kho
        if (quantity > product.getQuantity()) {
            return ResponseEntity.badRequest().body(null);
        }

        // Kiểm tra xem CartItem đã tồn tại chưa
        Optional<CartItem> existingItem = cart.getCartItems().stream()
                .filter(item -> item.getProduct().getBarcode().equals(barcode))
                .findFirst();

        if (existingItem.isPresent()) {
            CartItem cartItem = existingItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + quantity);
            cartItemRepository.save(cartItem); // Lưu thay đổi số lượng
        } else {
            CartItem cartItem = new CartItem();
            cartItem.setCart(cart); // Đã có setCart() trong CartItem
            cartItem.setProduct(product);
            cartItem.setQuantity(quantity);
            cart.getCartItems().add(cartItem);
            cartItemRepository.save(cartItem); // Lưu CartItem mới
        }

        // Lưu Cart (bao gồm các CartItem đã cập nhật)
        cartRepository.save(cart);
        return ResponseEntity.ok(cart);
    }

    @PutMapping("/{sessionId}/items/{barcode}")
    public ResponseEntity<Cart> updateCartItem(
            @PathVariable String sessionId,
            @PathVariable String barcode,
            @RequestBody Map<String, Integer> updateData) {
        // Tìm Cart
        Optional<Cart> cartOptional = cartRepository.findById(sessionId);
        if (!cartOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Cart cart = cartOptional.get();

        // Tìm CartItem
        Optional<CartItem> cartItemOptional = cart.getCartItems().stream()
                .filter(item -> item.getProduct().getBarcode().equals(barcode))
                .findFirst();

        if (!cartItemOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        CartItem cartItem = cartItemOptional.get();
        int newQuantity = updateData.getOrDefault("quantity", 0); // Kiểm tra giá trị mặc định

        Product product = cartItem.getProduct();

        if (newQuantity <= 0) {
            cart.getCartItems().remove(cartItem);
            cartItemRepository.delete(cartItem);
        } else if (newQuantity > product.getQuantity()) {
            return ResponseEntity.badRequest().body(null);
        } else {
            cartItem.setQuantity(newQuantity);
            cartItemRepository.save(cartItem);
        }

        cartRepository.save(cart);
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> clearCart(@PathVariable String sessionId) {
        Optional<Cart> cartOptional = cartRepository.findById(sessionId);
        if (cartOptional.isPresent()) {
            cartRepository.delete(cartOptional.get());
        }
        return ResponseEntity.ok().build();
    }
}