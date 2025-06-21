package com.aims.dto;

import java.util.Map;
import java.util.Set;

public class CartDTO {
    private String sessionId;
    private Set<CartItemDTO> items;
    private double totalPrice;
    private Map<String, Integer> deficiencies;
    private String status;
    private String errorMessage;

    public CartDTO(String sessionId, Set<CartItemDTO> items, double totalPrice,
                   Map<String, Integer> deficiencies, String status, String errorMessage) {
        this.sessionId = sessionId;
        this.items = items;
        this.totalPrice = totalPrice;
        this.deficiencies = deficiencies;
        this.status = status;
        this.errorMessage = errorMessage;
    }

    public CartDTO(String status, String errorMessage) {
        this.status = status;
        this.errorMessage = errorMessage;
    }

    // Getters and setters
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public Set<CartItemDTO> getItems() { return items; }
    public void setItems(Set<CartItemDTO> items) { this.items = items; }
    public double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(double totalPrice) { this.totalPrice = totalPrice; }
    public Map<String, Integer> getDeficiencies() { return deficiencies; }
    public void setDeficiencies(Map<String, Integer> deficiencies) { this.deficiencies = deficiencies; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public static class CartItemDTO {
        private String barcode;
        private String title;
        private int quantity;
        private double price;
        private boolean rushDelivery;

        public CartItemDTO(String barcode, String title, int quantity, double price, boolean rushDelivery) {
            this.barcode = barcode;
            this.title = title;
            this.quantity = quantity;
            this.price = price;
            this.rushDelivery = rushDelivery;
        }

        // Getters and setters
        public String getBarcode() { return barcode; }
        public void setBarcode(String barcode) { this.barcode = barcode; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
        public double getPrice() { return price; }
        public void setPrice(double price) { this.price = price; }
        public boolean isRushDelivery() { return rushDelivery; }
        public void setRushDelivery(boolean rushDelivery) { this.rushDelivery = rushDelivery; }
    }
}