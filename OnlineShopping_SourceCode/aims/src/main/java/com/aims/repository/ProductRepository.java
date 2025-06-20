package com.aims.repository;

import com.aims.model.Product;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ProductRepository extends JpaRepository<Product, String> {
    // Sử dụng Pageable cho findByCategory
    Page<Product> findByCategory(String category, Pageable pageable);

    Page<Product> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    // Sử dụng Pageable cho findByBarcode (phân trang)
    Page<Product> findByBarcode(String barcode, Pageable pageable);

    // Phương thức tìm một sản phẩm duy nhất (không phân trang)
    Product findByBarcode(String barcode);

    // Lấy sản phẩm ngẫu nhiên
    @Query(value = "SELECT * FROM product ORDER BY RANDOM()", nativeQuery = true)
    Page<Product> findRandom(Pageable pageable);

    // Xóa sản phẩm theo barcode
    @Transactional
    @Modifying
    @Query("DELETE FROM Product p WHERE p.barcode = ?1")
    void deleteByBarcode(String barcode);
}