package com.aims.model;

import java.io.Serializable;

public class CartItemId implements Serializable {
    private String sessionId;
    private String barcode;

    public CartItemId() {}

    public CartItemId(String sessionId, String barcode) {
        this.sessionId = sessionId;
        this.barcode = barcode;
    }

    // Getters, Setters, equals, hashCode
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CartItemId that = (CartItemId) o;
        return sessionId.equals(that.sessionId) && barcode.equals(that.barcode);
    }

    @Override
    public int hashCode() {
        return 31 * sessionId.hashCode() + barcode.hashCode();
    }
}