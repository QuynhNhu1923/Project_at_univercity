package com.aims.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @Column(name = "barcode", nullable = false)
    private String barcode;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "value", nullable = false)
    private double value;

    @Column(name = "price", nullable = false)
    private double price;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "warehouse_entry_date", nullable = false)
    private LocalDateTime warehouseEntryDate;

    @Column(name = "dimensions")
    private String dimensions;

    @Column(name = "weight", nullable = false)
    private double weight;

    @Column(name = "description")
    private String description;

    @Column(name = "condition", nullable = false)
    private String condition;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "rush_delivery", nullable = false)
    private boolean rushDelivery;

    // Constructors
    public Product() {}

    public Product(String barcode, String title, String category, double value, double price, int quantity,
                   LocalDateTime warehouseEntryDate, String dimensions, double weight, String description,
                   String condition, boolean rushDelivery) {
        this.barcode = barcode;
        this.title = title;
        this.category = category;
        this.value = value;
        this.price = price;
        this.quantity = quantity;
        this.warehouseEntryDate = warehouseEntryDate;
        this.dimensions = dimensions;
        this.weight = weight;
        this.description = description;
        this.condition = condition;
        this.rushDelivery = rushDelivery;
    }

    // Getters and Setters
    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public double getValue() { return value; }
    public void setValue(double value) { this.value = value; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public LocalDateTime getWarehouseEntryDate() { return warehouseEntryDate; }
    public void setWarehouseEntryDate(LocalDateTime warehouseEntryDate) { this.warehouseEntryDate = warehouseEntryDate; }

    public String getDimensions() { return dimensions; }
    public void setDimensions(String dimensions) { this.dimensions = dimensions; }

    public double getWeight() { return weight; }
    public void setWeight(double weight) { this.weight = weight; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public boolean isRushDelivery() { return rushDelivery; }
    public void setRushDelivery(boolean rushDelivery) { this.rushDelivery = rushDelivery; }
}