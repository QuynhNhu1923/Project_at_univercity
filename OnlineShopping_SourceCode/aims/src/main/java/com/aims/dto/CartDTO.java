package com.aims.dto;

import java.util.Set;

public class CartDTO {
    private String sessionId;
    private Set<CartItemDTO> cartItems;

    public CartDTO(String sessionId, Set<CartItemDTO> cartItems) {
        this.sessionId = sessionId;
        this.cartItems = cartItems;
    }

    // Getters và Setters
    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Set<CartItemDTO> getCartItems() {
        return cartItems;
    }

    public void setCartItems(Set<CartItemDTO> cartItems) {
        this.cartItems = cartItems;
    }

    // Định nghĩa CartItemDTO như một lớp nội bộ public static
    public static class CartItemDTO {
        private String barcode;
        private int quantity;

        public CartItemDTO(String barcode, int quantity) {
            this.barcode = barcode;
            this.quantity = quantity;
        }

        // Getters và Setters
        public String getBarcode() {
            return barcode;
        }

        public void setBarcode(String barcode) {
            this.barcode = barcode;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }
    }
}