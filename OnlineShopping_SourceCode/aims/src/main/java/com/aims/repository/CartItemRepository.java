package com.aims.repository;

import com.aims.model.Cart;
import com.aims.model.CartItem;
import com.aims.model.CartItemId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CartItemRepository extends JpaRepository<CartItem, CartItemId> {

    // Lấy toàn bộ item trong giỏ theo sessionId
    List<CartItem> findByCartSessionId(String sessionId);

    // Xóa toàn bộ item trong giỏ theo sessionId
    void deleteByCartSessionId(String sessionId);

    // Lấy 1 item theo sessionId và barcode
    CartItem findByCartSessionIdAndProductBarcode(String sessionId, String barcode);
}