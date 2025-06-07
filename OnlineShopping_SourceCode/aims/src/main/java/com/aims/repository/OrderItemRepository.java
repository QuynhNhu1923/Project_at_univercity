package com.aims.repository;

import com.aims.model.OrderItem;
import com.aims.model.OrderItemId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, OrderItemId> {
}