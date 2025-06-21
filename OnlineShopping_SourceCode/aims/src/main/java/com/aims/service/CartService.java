package com.aims.service;

import com.aims.model.*;
import com.aims.repository.CartItemRepository;
import com.aims.repository.CartRepository;
import com.aims.repository.ProductRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

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

    @Transactional(readOnly = true)
    public Product getProductForCart(String barcode) {
        if (barcode == null || barcode.trim().isEmpty()) {
            logger.warn("Invalid barcode: {}", barcode);
            throw new IllegalArgumentException("Barcode cannot be empty");
        }
        return productRepository.findById(barcode)
                .orElseThrow(() -> {
                    logger.error("Product not found for barcode: {}", barcode);
                    return new IllegalArgumentException("Product not found: " + barcode);
                });
    }

    @Transactional
    public Cart addToCart(String sessionId, String barcode, int quantity) {
        validateSessionId(sessionId);
        if (quantity <= 0) {
            logger.warn("Invalid quantity: {} for sessionId: {}, barcode: {}", quantity, sessionId, barcode);
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        Product product = getProductForCart(barcode);
        int availableQuantity = product.getQuantity();
        if (availableQuantity <= 0) {
            logger.warn("Product out of stock: {} for sessionId: {}", barcode, sessionId);
            throw new IllegalArgumentException("Product is out of stock: " + product.getTitle());
        }

        Cart cart = getOrCreateCart(sessionId);
        CartItemId itemId = new CartItemId(sessionId, barcode);
        Optional<CartItem> existingItemOpt = cartItemRepository.findById(itemId);

        int newQuantity = quantity;
        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            newQuantity = existingItem.getQuantity() + quantity;
            if (newQuantity > availableQuantity) {
                logger.warn("Requested quantity {} exceeds stock {} for product: {}",
                        newQuantity, availableQuantity, barcode);
                throw new IllegalArgumentException(
                        "Requested quantity exceeds stock for product: " + product.getTitle() +
                                ". Available: " + availableQuantity
                );
            }
            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
        } else {
            if (quantity > availableQuantity) {
                logger.warn("Requested quantity {} exceeds stock {} for product: {}",
                        quantity, availableQuantity, barcode);
                throw new IllegalArgumentException(
                        "Requested quantity exceeds stock for product: " + product.getTitle() +
                                ". Available: " + availableQuantity
                );
            }
            CartItem newItem = new CartItem(cart, product, quantity);
            cart.getCartItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        cartRepository.save(cart);
        logger.info("Added product [{}] x{} to cart [{}]", barcode, quantity, sessionId);
        return cart;
    }

    @Transactional(readOnly = true)
    public Cart getOrCreateCart(String sessionId) {
        validateSessionId(sessionId);
        Optional<Cart> cartOpt = cartRepository.findById(sessionId);
        if (cartOpt.isPresent()) {
            Cart cart = cartOpt.get();
            // Load products for cart items to avoid lazy loading issues
            cart.getCartItems().forEach(item -> item.getProduct());
            return cart;
        }
        logger.info("Creating new cart for sessionId: {}", sessionId);
        Cart newCart = new Cart(sessionId);
        return cartRepository.save(newCart);
    }

    @Transactional(readOnly = true)
    public Cart getCartWithStockCheck(String sessionId) {
        validateSessionId(sessionId);
        Cart cart = getOrCreateCart(sessionId);
        // Ensure products are loaded
        cart.getCartItems().forEach(item -> {
            Product product = getProductForCart(item.getBarcode());
            item.setProduct(product);
        });
        return cart;
    }

    @Transactional(readOnly = true)
    public Map<String, Integer> checkStockDeficiency(String sessionId) {
        validateSessionId(sessionId);
        Cart cart = getCartWithStockCheck(sessionId);
        Map<String, Integer> deficiencies = new HashMap<>();

        for (CartItem item : cart.getCartItems()) {
            int cartQuantity = item.getQuantity();
            int stock = item.getProduct().getQuantity();
            if (cartQuantity > stock) {
                deficiencies.put(item.getBarcode(), cartQuantity - stock);
                logger.info("Stock deficiency for product [{}] in cart [{}]: requested {}, available {}",
                        item.getBarcode(), sessionId, cartQuantity, stock);
            }
        }

        return deficiencies;
    }

    @Transactional
    public Cart removeFromCart(String sessionId, String barcode) {
        validateSessionId(sessionId);
        if (barcode == null || barcode.trim().isEmpty()) {
            logger.warn("Invalid barcode: {} for sessionId: {}", barcode, sessionId);
            throw new IllegalArgumentException("Barcode cannot be empty");
        }

        Cart cart = getOrCreateCart(sessionId);
        CartItemId itemId = new CartItemId(sessionId, barcode);
        Optional<CartItem> existingItem = cartItemRepository.findById(itemId);

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            cart.getCartItems().remove(item);
            cartItemRepository.delete(item);
            cartRepository.save(cart);
            logger.info("Removed product [{}] from cart [{}]", barcode, sessionId);
        } else {
            logger.warn("Item with barcode [{}] not found in cart [{}]", barcode, sessionId);
        }

        return cart;
    }

    @Transactional
    public Cart clearCart(String sessionId) {
        validateSessionId(sessionId);
        Cart cart = getOrCreateCart(sessionId);
        if (!cart.getCartItems().isEmpty()) {
            cartItemRepository.deleteByCartSessionId(sessionId);
            cart.getCartItems().clear();
            cartRepository.save(cart);
            logger.info("Cleared cart for session [{}]", sessionId);
        } else {
            logger.info("Cart already empty for session [{}]", sessionId);
        }
        return cart;
    }

    private void validateSessionId(String sessionId) {
        if (sessionId == null || sessionId.trim().isEmpty()) {
            logger.error("Invalid sessionId: {}", sessionId);
            throw new IllegalArgumentException("Session ID cannot be empty");
        }
    }
}