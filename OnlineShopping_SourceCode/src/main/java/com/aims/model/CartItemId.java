package com.aims.model;

import java.io.Serializable;
import java.util.Objects;

public class CartItemId implements Serializable {

    private String cart; // sessionId từ Cart
    private String product; // productBarcode từ Product

    // Constructor rỗng (yêu cầu bởi Hibernate)
    public CartItemId() {
    }

    // Constructor đầy đủ
    public CartItemId(String cart, String product) {
        this.cart = cart;
        this.product = product;
    }

    // Getter và Setter
    public String getCart() {
        return cart;
    }

    public void setCart(String cart) {
        this.cart = cart;
    }

    public String getProduct() {
        return product;
    }

    public void setProduct(String product) {
        this.product = product;
    }

    // Triển khai equals() và hashCode()
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CartItemId that = (CartItemId) o;
        return Objects.equals(cart, that.cart) &&
                Objects.equals(product, that.product);
    }

    @Override
    public int hashCode() {
        return Objects.hash(cart, product);
    }
}