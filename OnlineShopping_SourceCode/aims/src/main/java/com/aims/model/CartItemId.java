package com.aims.model;

import java.io.Serializable;
import java.util.Objects;

public class CartItemId implements Serializable {
    private String sessionId;
    private String barcode;

    public CartItemId() {}

    public CartItemId(String sessionId, String barcode) {
        this.sessionId = sessionId;
        this.barcode = barcode;
    }

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
        if (!(o instanceof CartItemId)) return false;
        CartItemId that = (CartItemId) o;
        return Objects.equals(sessionId, that.sessionId) &&
                Objects.equals(barcode, that.barcode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(sessionId, barcode);
    }
}
