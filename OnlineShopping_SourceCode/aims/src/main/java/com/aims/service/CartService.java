package com.aims.service; // Thay bằng package thực tế của bạn

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aims.model.Cart;
import com.aims.model.CartItem;
import com.aims.model.CartItemId;
import com.aims.model.Product;
import com.aims.repository.CartItemRepository;
import com.aims.repository.CartRepository;
import com.aims.repository.ProductRepository;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;

@Service
public class CartService {

    private static final Logger logger = LoggerFactory.getLogger(CartService.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Transactional
    public Cart addToCart(String sessionId, String barcode, int quantity) {
        try {
            if (quantity <= 0) {
                throw new IllegalArgumentException("Quantity must be greater than 0");
            }

            Product product = productRepository.findById(barcode)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + barcode));

            if (product.getQuantity() < quantity) {
                throw new IllegalArgumentException("Insufficient quantity in stock for barcode: " + barcode);
            }

            Cart cart = getOrCreateCart(sessionId);
            if (cart.getSessionId() == null) {
                throw new IllegalStateException("Cart session ID is null");
            }

            CartItemId itemId = new CartItemId(cart.getSessionId(), barcode);
            Optional<CartItem> existingItem = cartItemRepository.findById(itemId);

            CartItem item;
            if (existingItem.isPresent()) {
                item = existingItem.get();
                int newQuantity = item.getQuantity() + quantity;
                if (newQuantity > product.getQuantity()) {
                    throw new IllegalArgumentException("Requested quantity exceeds available stock for barcode: " + barcode);
                }
                item.setQuantity(newQuantity);
            } else {
                item = new CartItem(cart, product, quantity);
                cart.getCartItems().add(item);
            }

            item = entityManager.merge(item);
            cartItemRepository.save(item);

            product.setQuantity(product.getQuantity() - quantity);
            product.setUpdatedAt(LocalDateTime.now());
            productRepository.save(product);

            cartRepository.save(cart);

            logger.info("Added to cart - sessionId: {}, barcode: {}, quantity: {}", sessionId, barcode, quantity);
            return cart;
        } catch (Exception e) {
            logger.error("Error adding to cart - sessionId: {}, barcode: {}, quantity: {}, error: {}", sessionId, barcode, quantity, e.getMessage());
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public Cart getOrCreateCart(String sessionId) {
        return cartRepository.findById(sessionId).orElseGet(() -> {
            Cart cart = new Cart(sessionId);
            return cartRepository.save(cart);
        });
    }

    @Transactional
    public Cart getCart(String sessionId) {
        Cart cart = getOrCreateCart(sessionId);
        logger.info("Retrieved cart - sessionId: {}", sessionId);
        return cart;
    }

    @Transactional
    public Cart removeFromCart(String sessionId, String barcode) {
        try {
            Cart cart = getOrCreateCart(sessionId);
            CartItemId itemId = new CartItemId(sessionId, barcode);
            Optional<CartItem> existingItem = cartItemRepository.findById(itemId);

            if (existingItem.isPresent()) {
                CartItem item = existingItem.get();
                Product product = item.getProduct();
                int removedQuantity = item.getQuantity();
                product.setQuantity(product.getQuantity() + removedQuantity); // Hoàn lại số lượng
                product.setUpdatedAt(LocalDateTime.now());
                productRepository.save(product);

                cart.getCartItems().remove(item);
                cartRepository.save(cart);
                cartItemRepository.delete(item);

                logger.info("Removed from cart - sessionId: {}, barcode: {}, quantity: {}", sessionId, barcode, removedQuantity);
            } else {
                logger.warn("CartItem not found - sessionId: {}, barcode: {}", sessionId, barcode);
            }
            return cart;
        } catch (Exception e) {
            logger.error("Error removing from cart - sessionId: {}, barcode: {}, error: {}", sessionId, barcode, e.getMessage());
            throw e;
        }
    }

    @Transactional
    public Cart clearCart(String sessionId) {
        try {
            Cart cart = getOrCreateCart(sessionId);
            if (!cart.getCartItems().isEmpty()) {
                for (CartItem item : new HashSet<>(cart.getCartItems())) { // Sao chép để tránh ConcurrentModificationException
                    removeFromCart(sessionId, item.getBarcode());
                }
            }
            logger.info("Cleared cart - sessionId: {}", sessionId);
            return cart;
        } catch (Exception e) {
            logger.error("Error clearing cart - sessionId: {}, error: {}", sessionId, e.getMessage());
            throw e;
        }
    }
}