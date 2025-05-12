package com.aims.repository;

import com.aims.model.CartItem;
import com.aims.model.CartItemId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, CartItemId> {
}