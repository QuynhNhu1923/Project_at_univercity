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

        logger.info("[GET /api/products] Fetching products - page={}, sort={}, barcode={}, category={}", page, sort, barcode, category);
        try {
            Page<Product> products = productService.getAllProducts(page, sort, barcode, category);
            logger.info("→ Found {} products", products.getTotalElements());
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            logger.error("✖ Error while fetching products", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Product>> searchProducts(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "priceAsc") String sort) {

        logger.info("[GET /api/products/search] Searching - query={}, page={}, sort={}", query, page, sort);
        try {
            Page<Product> products = productService.searchProducts(query, page, sort);
            logger.info("→ Search successful: found {} products", products.getTotalElements());
            return ResponseEntity.ok(products);
        } catch (IllegalArgumentException e) {
            logger.warn("⚠ Invalid search input: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("✖ Error during search", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/price-limits")
    public ResponseEntity<Map<String, Object>> getPriceLimits(@RequestParam String barcode) {
        logger.info("[GET /api/products/price-limits] Fetching price limits for barcode={}", barcode);
        try {
            Map<String, Object> limits = productService.getPriceLimits(barcode);
            logger.info("→ Price limits retrieved: {}", limits);
            return ResponseEntity.ok(limits);
        } catch (IllegalArgumentException e) {
            logger.warn("⚠ Invalid barcode: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("✖ Error fetching price limits", e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_PRODUCT_MANAGER')")
    public ResponseEntity<String> createProduct(@RequestBody Map<String, Object> request) {
        logger.info("[POST /api/products] Creating product - Raw request: {}", request);
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
            logger.info("→ Parsed product: {}, specificDetails: {}", product, specificDetails);

            productService.saveProduct(product, specificDetails);
            logger.info("✓ Product created successfully: {}", product.getBarcode());
            return ResponseEntity.ok("Product created successfully");
        } catch (IllegalArgumentException e) {
            logger.warn("⚠ Invalid product input: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to create product: " + e.getMessage());
        } catch (Exception e) {
            logger.error("✖ Unexpected error while creating product", e);
            return ResponseEntity.status(500).body("Internal server error");
        }
    }

    @DeleteMapping("/{barcode}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_PRODUCT_MANAGER')")
    public ResponseEntity<String> deleteProduct(@PathVariable String barcode) {
        logger.info("[DELETE /api/products/{}] Deleting product", barcode);
        try {
            productService.deleteProduct(barcode);
            logger.info("✓ Product deleted: {}", barcode);
            return ResponseEntity.ok("Product deleted successfully");
        } catch (IllegalArgumentException e) {
            logger.warn("⚠ Failed to delete product - Invalid barcode: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to delete product: " + e.getMessage());
        } catch (Exception e) {
            logger.error("✖ Error while deleting product: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Internal server error");
        }
    }
}
