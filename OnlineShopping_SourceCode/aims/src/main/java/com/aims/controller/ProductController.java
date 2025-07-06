package com.aims.controller;

import com.aims.model.Product;
import com.aims.model.User;
import com.aims.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private static final Logger logger = LoggerFactory.getLogger(ProductController.class);

    @Autowired
    private ProductService productService;

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

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
            @RequestParam("field") String field,
            @RequestParam("keyword") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "priceAsc") String sort) {

        logger.info("[GET /api/products/search] Searching - field={}, keyword={}, page={}", field, keyword, page);
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, sort.split("Asc")[0]));
            Page<Product> products;

            switch (field.toLowerCase()) {
                case "barcode":
                    products = productService.findByBarcodeContainingIgnoreCase(keyword, pageable);
                    break;
                case "title":
                    products = productService.findByTitleContainingIgnoreCase(keyword, pageable);
                    break;
                case "category":
                    products = productService.findByCategoryContainingIgnoreCase(keyword, pageable);
                    break;
                default:
                    products = productService.findByBarcodeContainingIgnoreCaseOrTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase(keyword, keyword, keyword, pageable);
                    break;
            }

            logger.info("→ Search successful: found {} products", products.getTotalElements());
            return ResponseEntity.ok(products);
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

    @GetMapping("/daily-limits")
    public ResponseEntity<Long> getDailyLimits() {
        logger.info("[GET /api/products/daily-limits] Fetching daily operation limits");
        try {
            Long dailyOperations = productService.countTodayOperations();
            logger.info("→ Daily operations count: {}", dailyOperations);
            return ResponseEntity.ok(dailyOperations);
        } catch (Exception e) {
            logger.error("✖ Error fetching daily limits", e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createProduct(@RequestBody Map<String, Object> request, Authentication authentication) {
        logger.info("[POST /api/products] Creating product - title: {}", request.get("title"));
        try {
            // Validate request
            validateProductRequest(request);

            // Generate barcode if not provided
            String barcode = (String) request.get("barcode");
            if (barcode == null || barcode.trim().isEmpty()) {
                String category = (String) request.get("category");
                barcode = generateBarcode(category);
                request.put("barcode", barcode);
                logger.info("Generated barcode: {}", barcode);
            }

            // Get authenticated user
            User user = authentication != null ? (User) authentication.getPrincipal() : null;
            if (user == null) {
                logger.warn("No authenticated user found");
                throw new IllegalArgumentException("Authentication required");
            }

            // Save product via ProductService
            Product product = productService.saveProduct(request, user);

            logger.info("✓ Product created successfully: {}", product.getBarcode());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Product created successfully");
            response.put("barcode", product.getBarcode());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.warn("⚠ Invalid product input: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            logger.error("✖ Unexpected error while creating product", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PutMapping("/{barcode}")
    public ResponseEntity<Map<String, Object>> updateProduct(
            @PathVariable String barcode,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        logger.info("[PUT /api/products/{}] Updating product", barcode);
        try {
            // Validate request
            validateProductRequest(request);

            // Get authenticated user
            User user = authentication != null ? (User) authentication.getPrincipal() : null;
            if (user == null) {
                logger.warn("No authenticated user found");
                throw new IllegalArgumentException("Authentication required");
            }

            // Get existing product
            Product existingProduct = productService.getProductByBarcode(barcode);
            if (existingProduct == null) {
                logger.warn("⚠ Product not found for update: {}", barcode);
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "Product not found");
                return ResponseEntity.notFound().build();
            }

            // Update product fields in request map
            request.put("barcode", barcode); // Ensure barcode is included
            request.put("category", existingProduct.getCategory()); // Retain original category

            // Save updated product via ProductService
            productService.saveProduct(request, user);

            logger.info("✓ Product updated successfully: {}", barcode);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Product updated successfully");
            response.put("barcode", barcode);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.warn("⚠ Invalid product input: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            logger.error("✖ Unexpected error while updating product", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping(params = "barcode")
    public ResponseEntity<Map<String, Object>> getProductByBarcode(@RequestParam String barcode) {
        logger.info("[GET /api/products?barcode={}] Fetching product details", barcode);
        try {
            Map<String, Object> productDetails = productService.getProductDetailsWithSpecifics(barcode);
            if (productDetails.isEmpty()) {
                logger.warn("⚠ Product not found for barcode: {}", barcode);
                return ResponseEntity.notFound().build();
            }
            logger.info("→ Product details retrieved for: {}", barcode);

            // Wrap in content array for consistency with search endpoint
            Map<String, Object> response = new HashMap<>();
            response.put("content", List.of(productDetails));
            response.put("totalElements", 1);
            response.put("totalPages", 1);
            response.put("size", 1);
            response.put("number", 0);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("⚠ Invalid barcode: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("✖ Error fetching product details", e);
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{barcode}")
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable String barcode) {
        logger.info("[DELETE /api/products/{}] Deleting product", barcode);
        try {
            productService.deleteProduct(barcode);
            logger.info("✓ Product deleted: {}", barcode);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Product deleted successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("⚠ Failed to delete product: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            logger.error("✖ Error while deleting product: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Internal server error");
            return ResponseEntity.status(500).body(response);
        }
    }

    @DeleteMapping("/batch-delete")
    public ResponseEntity<Map<String, Object>> deleteProducts(@RequestBody List<String> barcodes) {
        logger.info("[DELETE /api/products/batch-delete] Deleting products: {}", barcodes);
        try {
            if (barcodes.size() > 10) {
                throw new IllegalArgumentException("Cannot delete more than 10 products at once");
            }

            productService.deleteProducts(barcodes);
            logger.info("✓ Products deleted: {}", barcodes);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Products deleted successfully");
            response.put("deletedCount", barcodes.size());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("⚠ Failed to delete products: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            logger.error("✖ Error while deleting products: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    private void validateProductRequest(Map<String, Object> request) {
        String title = (String) request.get("title");
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Product title is required");
        }
        String category = (String) request.get("category");
        if (category == null || category.trim().isEmpty()) {
            throw new IllegalArgumentException("Product category is required");
        }
        if (!List.of("Book", "CD", "LP", "DVD").contains(category)) {
            throw new IllegalArgumentException("Invalid category. Must be one of: Book, CD, LP, DVD");
        }
        Number value = (Number) request.get("value");
        if (value == null || value.doubleValue() <= 0) {
            throw new IllegalArgumentException("Product value must be greater than 0");
        }
        Number price = (Number) request.get("price");
        if (price == null || price.doubleValue() <= 0) {
            throw new IllegalArgumentException("Product price must be greater than 0");
        }
        if (price.doubleValue() < value.doubleValue() * 0.3 || price.doubleValue() > value.doubleValue() * 1.5) {
            throw new IllegalArgumentException("Price must be between 30% and 150% of product value");
        }
        Number quantity = (Number) request.get("quantity");
        if (quantity == null || quantity.intValue() < 0) {
            throw new IllegalArgumentException("Product quantity cannot be negative");
        }
        Number weight = (Number) request.get("weight");
        if (weight == null || weight.doubleValue() <= 0) {
            throw new IllegalArgumentException("Product weight must be greater than 0");
        }
        String condition = (String) request.get("condition");
        if (condition == null || condition.trim().isEmpty()) {
            throw new IllegalArgumentException("Product condition is required");
        }
        String conditionLower = condition.toLowerCase();
        List<String> validConditions = Arrays.asList("new", "used", "refurbished");
        if (!validConditions.contains(conditionLower)) {
            throw new IllegalArgumentException("Tình trạng sản phẩm không hợp lệ. Giá trị cho phép: " + validConditions);
        }
        // Validate warehouseEntryDate format
        String warehouseEntryDate = (String) request.get("warehouseEntryDate");
        if (warehouseEntryDate != null && !warehouseEntryDate.trim().isEmpty()) {
            try {
                LocalDateTime.parse(warehouseEntryDate, dateFormatter);
            } catch (DateTimeParseException e) {
                try {
                    LocalDateTime.parse(warehouseEntryDate + "T00:00:00", dateFormatter);
                } catch (DateTimeParseException ex) {
                    logger.warn("Invalid warehouse entry date format: {}", warehouseEntryDate);
                    throw new IllegalArgumentException("Invalid warehouse entry date format: " + warehouseEntryDate);
                }
            }
        }
    }

    private String generateBarcode(String category) {
        String prefix = switch (category != null ? category.toUpperCase() : "") {
            case "BOOK" -> "BK";
            case "CD" -> "CD";
            case "LP" -> "LP";
            case "DVD" -> "DV";
            default -> "PD";
        };

        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
        return prefix + uuid;
    }
}