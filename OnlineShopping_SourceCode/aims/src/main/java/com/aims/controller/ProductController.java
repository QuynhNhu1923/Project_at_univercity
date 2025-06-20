package com.aims.controller;

import com.aims.model.Product;
import com.aims.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private static final Logger logger = LoggerFactory.getLogger(ProductController.class);

    @Autowired
    private ProductService productService;

    @GetMapping
    public ResponseEntity<Page<Product>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "priceAsc") String sort,
            @RequestParam(required = false) String barcode,
            @RequestParam(required = false) String category) {
        logger.info("Fetching products: page={}, sort={}, barcode={}, category={}", page, sort, barcode, category);
        try {
            Page<Product> products = productService.getAllProducts(page, sort, barcode, category);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            logger.error("Error fetching products: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Product>> searchProducts(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "priceAsc") String sort) {
        logger.info("Searching products: query={}, page={}, sort={}", query, page, sort);
        try {
            Page<Product> products = productService.searchProducts(query, page, sort);
            return ResponseEntity.ok(products);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid search parameters: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error searching products: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/price-limits")
    public ResponseEntity<Map<String, Object>> getPriceLimits(@RequestParam String barcode) {
        logger.info("Fetching price limits for barcode: {}", barcode);
        try {
            Map<String, Object> limits = productService.getPriceLimits(barcode);
            return ResponseEntity.ok(limits);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid barcode: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error fetching price limits: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_PRODUCT_MANAGER')")
    public ResponseEntity<String> createProduct(@RequestBody Map<String, Object> request) {
        logger.info("Creating product");
        try {
            Product product = new Product();
            Map<String, Object> productData = (Map<String, Object>) request.get("product");
            product.setBarcode((String) productData.get("barcode"));
            product.setTitle((String) productData.get("title"));
            product.setCategory((String) productData.get("category"));
            product.setValue(Double.parseDouble(productData.get("value").toString()));
            product.setPrice(Double.parseDouble(productData.get("price").toString()));
            product.setQuantity((Integer) productData.get("quantity"));
            product.setWarehouseEntryDate(new java.text.SimpleDateFormat("yyyy-MM-dd").parse((String) productData.get("warehouseEntryDate")));
            product.setDimensions((String) productData.get("dimensions"));
            product.setWeight(Double.parseDouble(productData.get("weight").toString()));
            product.setDescription((String) productData.get("description"));
            product.setCondition((String) productData.get("condition"));

            Map<String, Object> specificDetails = (Map<String, Object>) request.get("specificDetails");
            productService.saveProduct(product, specificDetails);
            return ResponseEntity.ok("Product created successfully");
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid product data: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to create product: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error creating product: {}", e.getMessage());
            return ResponseEntity.status(500).body("Internal server error");
        }
    }

    @DeleteMapping("/{barcode}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_PRODUCT_MANAGER')")
    public ResponseEntity<String> deleteProduct(@PathVariable String barcode) {
        logger.info("Deleting product: barcode={}", barcode);
        try {
            productService.deleteProduct(barcode);
            return ResponseEntity.ok("Product deleted successfully");
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid barcode: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to delete product: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error deleting product: {}", e.getMessage());
            return ResponseEntity.status(500).body("Internal server error");
        }
    }
}