package com.aims.model;

import jakarta.persistence.*;

@Entity
@Table(name = "cart_items")
@IdClass(CartItemId.class)
public class CartItem {
    @Id
    @Column(name = "session_id")
    private String sessionId;

    @Id
    @Column(name = "barcode")
    private String barcode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", insertable = false, updatable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barcode", insertable = false, updatable = false)
    private Product product;

    @Column(name = "quantity")
    private int quantity;
    public CartItem() {}

    public CartItem(Cart cart, Product product, int quantity) {
        this.sessionId = cart.getSessionId();
        this.barcode = product.getBarcode();
        this.cart = cart;
        this.product = product;
        this.quantity = quantity;
    }

    // Getters and Setters
    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }

    public Cart getCart() {
        return cart;
    }

    public void setCart(Cart cart) {
        this.sessionId = cart.getSessionId();
        this.cart = cart;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.barcode = product.getBarcode();
        this.product = product;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public CartItemId getId() {
        return new CartItemId(sessionId, barcode);
    }

    public void setId(CartItemId id) {
        this.sessionId = id.getSessionId();
        this.barcode = id.getBarcode();
    }
}