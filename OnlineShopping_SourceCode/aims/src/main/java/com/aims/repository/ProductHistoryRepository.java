package com.aims.repository;

import com.aims.model.ProductHistory;
import com.aims.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProductHistoryRepository extends JpaRepository<ProductHistory, Long> {
    @Query("SELECT COUNT(h) FROM ProductHistory h WHERE FUNCTION('DATE', h.operationDate) = FUNCTION('DATE', CURRENT_DATE)")
    long countTodayOperations();

    @Query("SELECT COUNT(h) FROM ProductHistory h WHERE h.barcode = :barcode AND h.operation = 'PRICE_UPDATE' AND FUNCTION('DATE', h.operationDate) = FUNCTION('DATE', CURRENT_DATE)")
    long countTodayPriceUpdatesByBarcode(String barcode);

    @Query("SELECT COUNT(h) FROM ProductHistory h WHERE h.operation = 'DELETE' AND FUNCTION('DATE', h.operationDate) = FUNCTION('DATE', CURRENT_DATE)")
    long countTodayDeletions();

    Page<ProductHistory> findByBarcode(String barcode, Pageable pageable);

    Page<ProductHistory> findByUser(User user, Pageable pageable);
}