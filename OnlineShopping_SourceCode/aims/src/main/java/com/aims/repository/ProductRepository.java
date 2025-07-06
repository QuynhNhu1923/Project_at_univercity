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

    // Tìm kiếm theo title
    Page<Product> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    // Tìm kiếm theo barcode với pagination
    Page<Product> findByBarcode(String barcode, Pageable pageable);

    // Tìm kiếm theo barcode không pagination (cho detail)
    Product findByBarcode(String barcode);

    // Tìm kiếm theo barcode containing
    Page<Product> findByBarcodeContainingIgnoreCase(String barcode, Pageable pageable);

    // Tìm kiếm theo category containing
    Page<Product> findByCategoryContainingIgnoreCase(String category, Pageable pageable);

    // Tìm kiếm tổng hợp
    Page<Product> findByBarcodeContainingIgnoreCaseOrTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase(
            String barcode, String title, String category, Pageable pageable);

    // Lấy sản phẩm ngẫu nhiên
    @Query(value = "SELECT * FROM products ORDER BY RANDOM() LIMIT ?1", nativeQuery = true)
    Page<Product> findRandom(Pageable pageable);

    // Xóa sản phẩm theo barcode
    @Transactional
    @Modifying
    @Query("DELETE FROM Product p WHERE p.barcode = ?1")
    void deleteByBarcode(String barcode);

    // Kiểm tra sản phẩm tồn tại
    boolean existsByBarcode(String barcode);
}