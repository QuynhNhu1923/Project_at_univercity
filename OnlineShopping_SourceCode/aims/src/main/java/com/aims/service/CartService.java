
package com.aims.service;

import com.aims.model.Cart;
import com.aims.model.CartItem;
import com.aims.model.Product;
import com.aims.repository.CartRepository;
import com.aims.repository.ProductRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@Transactional
public class CartService {
    private static final Logger logger = LoggerFactory.getLogger(CartService.class);

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductRepository productRepository;

    public Cart getOrCreateCart(String sessionId) {
        logger.info("Getting or creating cart for session: {}", sessionId);
        Optional<Cart> cart = cartRepository.findBySessionId(sessionId);
        if (cart.isPresent()) {
            logger.info("Found existing cart: {}", sessionId);
            return cart.get();
        }

        Cart newCart = new Cart();
        newCart.setSessionId(sessionId);
        Cart savedCart = cartRepository.save(newCart);
        logger.info("Created new cart: {}", sessionId);
        return savedCart;
    }

    public Cart addToCart(String sessionId, String barcode, int quantity) {
        logger.info("Adding product {} to cart {} with quantity {}", barcode, sessionId, quantity);
        Cart cart = getOrCreateCart(sessionId);
        Product product = productRepository.findByBarcode(barcode);
        if (product == null) {
            logger.error("Product not found: {}", barcode);
            throw new IllegalArgumentException("Product not found");
        }
        if (quantity <= 0 || quantity > product.getQuantity()) {
            logger.error("Invalid quantity for product {}: requested {}, available {}", barcode, quantity, product.getQuantity());
            throw new IllegalArgumentException("Invalid quantity");
        }

        Optional<CartItem> existingItem = cart.getCartItems().stream()
                .filter(item -> item.getProduct().getBarcode().equals(barcode))
                .findFirst();

        if (existingItem.isPresent()) {
            CartItem cartItem = existingItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + quantity);
            logger.info("Updated quantity for product {} in cart {}", barcode, sessionId);
        } else {
            CartItem cartItem = new CartItem();
            //cartItem.setId(new CartItemId(sessionId, barcode));
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantity(quantity);
            cart.getCartItems().add(cartItem);
            logger.info("Added new product {} to cart {}", barcode, sessionId);
        }

        Cart savedCart = cartRepository.save(cart);
        return savedCart;
    }

    public Cart removeFromCart(String sessionId, String barcode) {
        logger.info("Removing product {} from cart {}", barcode, sessionId);
        Cart cart = cartRepository.findBySessionId(sessionId)
                .orElseThrow(() -> {
                    logger.error("Cart not found: {}", sessionId);
                    return new IllegalArgumentException("Cart not found");
                });

        cart.getCartItems().removeIf(item -> item.getProduct().getBarcode().equals(barcode));
        Cart savedCart = cartRepository.save(cart);
        logger.info("Removed product {} from cart {}", barcode, sessionId);
        return savedCart;
    }

    public void clearCart(String sessionId) {
        logger.info("Clearing cart: {}", sessionId);
        Cart cart = cartRepository.findBySessionId(sessionId)
                .orElseThrow(() -> {
                    logger.error("Cart not found: {}", sessionId);
                    return new IllegalArgumentException("Cart not found");
                });

        cart.getCartItems().clear();
        cartRepository.save(cart);
        logger.info("Cleared cart: {}", sessionId);
    }
}