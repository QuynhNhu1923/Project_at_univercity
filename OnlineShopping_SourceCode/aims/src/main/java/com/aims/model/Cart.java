package com.aims.model;

import jakarta.persistence.*;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "carts")
public class Cart {

    @Id
    @Column(name = "session_id")
    private String sessionId;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<CartItem> cartItems = new HashSet<>();

    @Column(name = "total_price")
    private double totalPrice;

    @Column(name = "created_at")
    private java.sql.Timestamp createdAt = new java.sql.Timestamp(System.currentTimeMillis());

    @Transient
    private Map<String, Integer> deficiencies = new HashMap<>();

    public Cart() {}

    public Cart(String sessionId) {
        this.sessionId = sessionId;
        this.totalPrice = 0.0;
        this.createdAt = new java.sql.Timestamp(System.currentTimeMillis());
    }

    // Getters and Setters
    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Set<CartItem> getCartItems() {
        return cartItems;
    }

    public void setCartItems(Set<CartItem> cartItems) {
        this.cartItems = cartItems;
    }

    public double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(double totalPrice) {
        this.totalPrice = totalPrice;
    }

    public Map<String, Integer> getDeficiencies() {
        return deficiencies;
    }

    public void setDeficiencies(Map<String, Integer> deficiencies) {
        this.deficiencies = deficiencies;
    }

    public java.sql.Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.sql.Timestamp createdAt) {
        this.createdAt = createdAt;
    }
}