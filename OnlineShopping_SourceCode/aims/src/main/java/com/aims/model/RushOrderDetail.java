package com.aims.model;

import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "Rush_Order_Details")
public class RushOrderDetail {

    @Id
    @Column(name = "order_id")
    private Integer orderId;

    @Column(name = "delivery_time", nullable = false)
    private LocalTime deliveryTime;

    @Column(name = "delivery_instructions")
    private String deliveryInstructions;

    @OneToOne
    @MapsId
    @JoinColumn(name = "order_id")
    private Order order;

    // Getters and setters
    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public LocalTime getDeliveryTime() {
        return deliveryTime;
    }

    public void setDeliveryTime(LocalTime deliveryTime) {
        this.deliveryTime = deliveryTime;
    }

    public String getDeliveryInstructions() {
        return deliveryInstructions;
    }

    public void setDeliveryInstructions(String deliveryInstructions) {
        this.deliveryInstructions = deliveryInstructions;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }
}