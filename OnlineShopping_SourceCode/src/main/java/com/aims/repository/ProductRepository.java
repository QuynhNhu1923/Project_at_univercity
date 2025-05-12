package com.aims.repository;

import com.aims.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByCategory(String category);
    Page<Product> findByTitleContainingIgnoreCase(String title, Pageable pageable);
}