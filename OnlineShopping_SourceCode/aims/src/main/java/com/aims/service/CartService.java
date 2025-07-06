package com.aims.service;

import com.aims.dto.CartDTO;
import com.aims.model.*;
import com.aims.repository.CartItemRepository;
import com.aims.repository.CartRepository;
import com.aims.repository.ProductRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

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
    public CartDTO addToCartDTO(String sessionId, String barcode, int quantity) {
        Cart cart = addToCart(sessionId, barcode, quantity);
        return convertToDTO(cart);
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

        // Lấy hoặc tạo giỏ hàng
        Cart cart = getOrCreateCart(sessionId);
        // Đảm bảo giỏ hàng được lưu vào cơ sở dữ liệu
        cartRepository.saveAndFlush(cart);
        logger.debug("Cart saved with sessionId: {} to table carts", sessionId);

        CartItemId itemId = new CartItemId(sessionId, barcode);
        Optional<CartItem> existingItemOpt = cartItemRepository.findById(itemId);

        int newQuantity = quantity;
        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            newQuantity = existingItem.getQuantity() + quantity;
            if (newQuantity > availableQuantity) {
                logger.warn("Requested quantity {} exceeds stock {} for product: {}", newQuantity, availableQuantity, barcode);
                throw new IllegalArgumentException(
                        "Requested quantity exceeds stock for product: " + product.getTitle() +
                                ". Available: " + availableQuantity);
            }
            existingItem.setQuantity(newQuantity);
            cartItemRepository.saveAndFlush(existingItem); // Lưu CartItem ngay lập tức
        } else {
            if (quantity > availableQuantity) {
                logger.warn("Requested quantity {} exceeds stock {} for product: {}", quantity, availableQuantity, barcode);
                throw new IllegalArgumentException(
                        "Requested quantity exceeds stock for product: " + product.getTitle() +
                                ". Available: " + availableQuantity);
            }
            CartItem newItem = new CartItem(cart, product, quantity);
            cartItemRepository.saveAndFlush(newItem); // Lưu CartItem ngay lập tức
            cart.getCartItems().add(newItem);
        }

        updateCartTotalPrice(cart);
        cartRepository.save(cart);
        logger.info("Added/Updated product [{}] x{} to cart [{}], totalPrice: {}", barcode, newQuantity, sessionId, cart.getTotalPrice());
        return cart;
    }

    @Transactional
    public void updateCartTotalPrice(Cart cart) {
        double totalPrice = cart.getCartItems().stream()
                .mapToDouble(cartItem -> {
                    Product prod = cartItem.getProduct();
                    if (prod == null) {
                        logger.warn("Product is null for cartItem with barcode: {}", cartItem.getBarcode());
                        return 0.0;
                    }
                    return prod.getPrice() * cartItem.getQuantity();
                })
                .sum();
        cart.setTotalPrice(totalPrice);
    }

    @Transactional
    public Cart getOrCreateCart(String sessionId) {
        validateSessionId(sessionId);
        Optional<Cart> cartOpt = cartRepository.findById(sessionId); // Loại bỏ LockModeType
        if (cartOpt.isPresent()) {
            Cart cart = cartOpt.get();
            cart.getCartItems().forEach(cartItem -> {
                if (cartItem.getProduct() == null) {
                    cartItem.setProduct(getProductForCart(cartItem.getBarcode()));
                }
            });
            updateCartTotalPrice(cart);
            cartRepository.save(cart);
            return cart;
        }
        logger.info("Creating new cart for sessionId: {}", sessionId);
        Cart newCart = new Cart(sessionId);
        newCart.setTotalPrice(0.0);
        return cartRepository.saveAndFlush(newCart); // Sử dụng saveAndFlush để lưu ngay
    }

    @Transactional
    public CartDTO getCartWithStockCheckDTO(String sessionId) {
        Cart cart = getCartWithStockCheck(sessionId);
        return convertToDTO(cart);
    }

    @Transactional
    public Cart getCartWithStockCheck(String sessionId) {
        validateSessionId(sessionId);
        Cart cart = getOrCreateCart(sessionId);
        cart.getCartItems().forEach(cartItem -> {
            if (cartItem.getProduct() == null) {
                cartItem.setProduct(getProductForCart(cartItem.getBarcode()));
            }
        });
        Map<String, Integer> deficiencies = checkStockDeficiency(sessionId);
        cart.setDeficiencies(deficiencies);
        return cart;
    }

    @Transactional
    public Map<String, Integer> checkStockDeficiency(String sessionId) {
        validateSessionId(sessionId);
        Cart cart = getOrCreateCart(sessionId);
        Map<String, Integer> deficiencies = new HashMap<>();

        for (CartItem cartItem : cart.getCartItems()) {
            int cartQuantity = cartItem.getQuantity();
            int stock = cartItem.getProduct().getQuantity();
            if (cartQuantity > stock) {
                deficiencies.put(cartItem.getBarcode(), cartQuantity - stock);
                logger.info("Stock deficiency for product [{}] in cart [{}]: requested {}, available {}",
                        cartItem.getBarcode(), sessionId, cartQuantity, stock);
            }
        }

        return deficiencies;
    }

    @Transactional
    public CartDTO removeFromCartDTO(String sessionId, String barcode) {
        Cart cart = removeFromCart(sessionId, barcode);
        return convertToDTO(cart);
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
            updateCartTotalPrice(cart);
            cartRepository.save(cart);
            logger.info("Removed product [{}] from cart [{}], new totalPrice: {}",
                    barcode, sessionId, cart.getTotalPrice());
        } else {
            logger.warn("Item with barcode [{}] not found in cart [{}]", barcode, sessionId);
        }

        return cart;
    }

    @Transactional
    public CartDTO clearCartDTO(String sessionId) {
        Cart cart = clearCart(sessionId);
        return convertToDTO(cart);
    }

    @Transactional
    public Cart clearCart(String sessionId) {
        validateSessionId(sessionId);
        Cart cart = getOrCreateCart(sessionId);

        if (!cart.getCartItems().isEmpty()) {
            cartItemRepository.deleteByCartSessionId(sessionId);
            cart.getCartItems().clear();
            cart.setTotalPrice(0.0);
            cart.setDeficiencies(new HashMap<>());
            cartRepository.save(cart);
            logger.info("Cleared cart for session [{}], totalPrice: 0.0", sessionId);
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

    private CartDTO convertToDTO(Cart cart) {
        Set<CartDTO.CartItemDTO> itemDTOs = cart.getCartItems().stream()
                .map(item -> new CartDTO.CartItemDTO(
                        item.getBarcode(),
                        item.getProduct().getTitle(),
                        item.getQuantity(),
                        item.getProduct().getPrice(),
                        item.getProduct().isRushDelivery()
                )).collect(Collectors.toSet());

        Map<String, Integer> deficiencies = checkStockDeficiency(cart.getSessionId());
        String status = deficiencies.isEmpty() ? "OK" : "WARNING";
        String errorMessage = deficiencies.isEmpty() ? null : "Some items are out of stock.";

        return new CartDTO(
                cart.getSessionId(),
                itemDTOs,
                cart.getTotalPrice(),
                deficiencies,
                status,
                errorMessage
        );
    }
}