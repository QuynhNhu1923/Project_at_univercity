package com.aims.model;

import java.io.Serializable;
import java.util.Objects;

public class OrderItemId implements Serializable {

    private Long order; // orderId
    private String product; // productId (barcode)

    // Constructor rỗng
    public OrderItemId() {
    }

    // Constructor đầy đủ
    public OrderItemId(Long order, String product) {
        this.order = order;
        this.product = product;
    }

    // Getter và Setter
    public Long getOrder() {
        return order;
    }

    public void setOrder(Long order) {
        this.order = order;
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
        OrderItemId that = (OrderItemId) o;
        return Objects.equals(order, that.order) &&
                Objects.equals(product, that.product);
    }

    @Override
    public int hashCode() {
        return Objects.hash(order, product);
    }
}