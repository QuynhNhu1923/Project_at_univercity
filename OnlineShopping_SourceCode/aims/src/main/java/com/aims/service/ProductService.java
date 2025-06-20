package com.aims.service;

import com.aims.model.Book;
import com.aims.model.CD;
import com.aims.model.LP;
import com.aims.model.Product;
import com.aims.repository.BookRepository;
import com.aims.repository.CDRepository;
import com.aims.repository.LPRepository;
import com.aims.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProductService {
    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CDRepository cdRepository;

    @Autowired
    private LPRepository lpRepository;

    public Page<Product> getAllProducts(int page, String sort, String barcode, String category) {
        Sort sortOrder = sort.equalsIgnoreCase("priceDesc") ? Sort.by("price").descending() : Sort.by("price").ascending();
        Pageable pageable = PageRequest.of(page, 20, sortOrder); // Sử dụng Pageable với kích thước 20
        Page<Product> products;
        if (barcode != null && !barcode.isEmpty()) {
            products = productRepository.findByBarcode(barcode, pageable); // Sử dụng phiên bản phân trang
            logger.info("Fetched product by barcode {}: {} found", barcode, products.getTotalElements());
        } else if (category != null && !category.isEmpty()) {
            products = productRepository.findByCategory(category, pageable); // Sử dụng phiên bản phân trang
            logger.info("Fetched products by category {}: {} found", category, products.getTotalElements());
        } else {
            products = productRepository.findAll(pageable);
            logger.info("Fetched all products: {} found for page {}", products.getTotalElements(), page);
        }
        return products;
    }

    public Page<Product> searchProducts(String query, int page, String sort) {
        if (query == null || query.trim().isEmpty()) {
            logger.warn("Invalid search query provided");
            throw new IllegalArgumentException("Search query cannot be empty");
        }
        Sort sortOrder = sort.equalsIgnoreCase("priceDesc") ? Sort.by("price").descending() : Sort.by("price").ascending();
        Pageable pageable = PageRequest.of(page, 20, sortOrder);
        Page<Product> products = productRepository.findByTitleContainingIgnoreCase(query, pageable);
        logger.info("Searched products with query '{}': {} found", query, products.getTotalElements());
        return products;
    }

    public Product getProductByBarcode(String barcode) {
        if (barcode == null || barcode.trim().isEmpty()) {
            logger.error("Invalid barcode provided");
            throw new IllegalArgumentException("Invalid barcode");
        }
        Product product = productRepository.findByBarcode(barcode); // Sử dụng phương thức không phân trang
        if (product == null) {
            logger.warn("Product not found for barcode: {}", barcode);
        } else {
            logger.info("Fetched product by barcode: {}", barcode);
        }
        return product;
    }

    public Map<String, Object> getPriceLimits(String barcode) {
        Product product = getProductByBarcode(barcode);
        if (product == null) {
            logger.warn("Product not found for price limits: {}", barcode);
            throw new IllegalArgumentException("Product not found");
        }
        Map<String, Object> limits = new HashMap<>();
        limits.put("minPrice", product.getPrice() * 0.3);
        limits.put("maxPrice", product.getPrice() * 1.5);
        limits.put("updateCount", 0);
        logger.info("Fetched price limits for product: {}", barcode);
        return limits;
    }

    public void saveProduct(Product product, Map<String, Object> specificDetails) {
        if (product == null || product.getBarcode() == null || product.getBarcode().trim().isEmpty()) {
            logger.error("Invalid product provided for saving");
            throw new IllegalArgumentException("Invalid product");
        }

        // Validate category
        String category = product.getCategory();
        if (!List.of("Book", "CD", "LP", "DVD").contains(category)) {
            logger.error("Invalid category: {}", category);
            throw new IllegalArgumentException("Invalid category: " + category);
        }

        // Save Product
        productRepository.save(product);
        logger.info("Saved product: {}", product.getBarcode());

        // Save specific details based on category
        switch (category) {
            case "Book":
                Book book = new Book();
                book.setBarcode(product.getBarcode());
                book.setProduct(product);
                book.setAuthors((String) specificDetails.getOrDefault("authors", ""));
                book.setCoverType((String) specificDetails.getOrDefault("coverType", ""));
                book.setPublisher((String) specificDetails.getOrDefault("publisher", ""));
                book.setPublicationDate((java.util.Date) specificDetails.getOrDefault("publicationDate", new java.util.Date()));
                book.setNumPages((Integer) specificDetails.getOrDefault("numPages", 0));
                book.setLanguage((String) specificDetails.getOrDefault("language", ""));
                book.setGenre((String) specificDetails.getOrDefault("genre", ""));
                bookRepository.save(book);
                logger.info("Saved book details for barcode: {}", product.getBarcode());
                break;
            case "CD":
                CD cd = new CD();
                cd.setBarcode(product.getBarcode());
                cd.setProduct(product);
                cd.setArtists((String) specificDetails.getOrDefault("artists", ""));
                cd.setRecordLabel((String) specificDetails.getOrDefault("recordLabel", ""));
                cd.setTracklist((String) specificDetails.getOrDefault("tracklist", ""));
                cd.setGenre((String) specificDetails.getOrDefault("genre", ""));
                cd.setReleaseDate((java.util.Date) specificDetails.getOrDefault("releaseDate", new java.util.Date()));
                cdRepository.save(cd);
                logger.info("Saved CD details for barcode: {}", product.getBarcode());
                break;
            case "LP":
                LP lp = new LP();
                lp.setBarcode(product.getBarcode());
                lp.setProduct(product);
                lp.setArtists((String) specificDetails.getOrDefault("artists", ""));
                lp.setRecordLabel((String) specificDetails.getOrDefault("recordLabel", ""));
                lp.setTracklist((String) specificDetails.getOrDefault("tracklist", ""));
                lp.setGenre((String) specificDetails.getOrDefault("genre", ""));
                lp.setReleaseDate((java.util.Date) specificDetails.getOrDefault("releaseDate", new java.util.Date()));
                lpRepository.save(lp);
                logger.info("Saved LP details for barcode: {}", product.getBarcode());
                break;
            default:
                logger.info("No specific details saved for category: {}", category);
        }
    }

    public void deleteProduct(String barcode) {
        if (barcode == null || barcode.trim().isEmpty()) {
            logger.error("Invalid barcode provided for deletion");
            throw new IllegalArgumentException("Invalid barcode");
        }
        // Delete specific details
        bookRepository.deleteById(barcode);
        cdRepository.deleteById(barcode);
        lpRepository.deleteById(barcode);
        // Delete Product
        productRepository.deleteByBarcode(barcode);
        logger.info("Deleted product: {}", barcode);
    }
}