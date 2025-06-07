package com.aims.repository;

import com.aims.model.Product;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByCategory(String category);
    Page<Product> findByTitleContainingIgnoreCase(String title, Pageable pageable);
//    Page<Product> findByTypeContainingIgnoreCase(String type, Pageable pageable);
//    Page<Product> findByAuthorContainingIgnoreCase(String author, Pageable pageable);
//    Page<Product> findByBarcode(String barcode, Pageable pageable);

    // Tìm sản phẩm theo barcode (single result)
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