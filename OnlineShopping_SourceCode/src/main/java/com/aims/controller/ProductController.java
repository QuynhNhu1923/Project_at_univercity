package com.aims.controller;

import com.aims.model.*;
import com.aims.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CDRepository cdRepository;

    @Autowired
    private LPRepository lpRepository;

    @Autowired
    private DVDRepository dvdRepository;

    @Autowired
    private ProductHistoryRepository productHistoryRepository;

    @GetMapping
    public Page<Product> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort) {
        Pageable pageable;
        if (sort != null) {
            if (sort.equals("price-asc")) {
                pageable = PageRequest.of(page, size, Sort.by("price").ascending());
            } else if (sort.equals("price-desc")) {
                pageable = PageRequest.of(page, size, Sort.by("price").descending());
            } else {
                pageable = PageRequest.of(page, size);
            }
        } else {
            pageable = PageRequest.of(page, size);
        }
        return productRepository.findAll(pageable);
    }

    @GetMapping("/search")
    public Page<Product> searchProducts(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort) {
        Pageable pageable;
        if (sort != null) {
            if (sort.equals("price-asc")) {
                pageable = PageRequest.of(page, size, Sort.by("price").ascending());
            } else if (sort.equals("price-desc")) {
                pageable = PageRequest.of(page, size, Sort.by("price").descending());
            } else {
                pageable = PageRequest.of(page, size);
            }
        } else {
            pageable = PageRequest.of(page, size);
        }
        return productRepository.findByTitleContainingIgnoreCase(query, pageable);
    }

    @PostMapping
    @PreAuthorize("hasRole('PRODUCT_MANAGER')")
    public ResponseEntity<Product> addProduct(@RequestBody Map<String, Object> productData) {
        Product product = new Product();
        product.setBarcode((String) productData.get("barcode"));
        product.setTitle((String) productData.get("title"));
        product.setCategory((String) productData.get("category"));
        product.setValue(Double.parseDouble(productData.get("value").toString()));
        product.setPrice(Double.parseDouble(productData.get("price").toString()));
        product.setQuantity(Integer.parseInt(productData.get("quantity").toString()));
        product.setWarehouseEntryDate(new java.util.Date());
        product.setDimensions((String) productData.get("dimensions"));
        product.setWeight(Double.parseDouble(productData.get("weight").toString()));
        product.setDescription((String) productData.get("description"));
        product.setCondition((String) productData.get("condition"));

        Product savedProduct = productRepository.save(product);

        switch (savedProduct.getCategory()) {
            case "Book":
                Book book = new Book();
                book.setBarcode(savedProduct.getBarcode());
                book.setAuthors((String) productData.get("authors"));
                book.setCoverType((String) productData.get("coverType"));
                book.setPublisher((String) productData.get("publisher"));
                book.setPublicationDate(new java.util.Date());
                book.setNumPages(Integer.parseInt(productData.get("numPages").toString()));
                book.setLanguage((String) productData.get("language"));
                book.setGenre((String) productData.get("genre"));
                book.setProduct(savedProduct);
                bookRepository.save(book);
                break;
            case "CD":
                CD cd = new CD();
                cd.setBarcode(savedProduct.getBarcode());
                cd.setArtists((String) productData.get("artists"));
                cd.setRecordLabel((String) productData.get("recordLabel"));
                cd.setTracklist((String) productData.get("tracklist"));
                cd.setGenre((String) productData.get("genre"));
                cd.setReleaseDate(new java.util.Date());
                cd.setProduct(savedProduct);
                cdRepository.save(cd);
                break;
            case "LP":
                LP lp = new LP();
                lp.setBarcode(savedProduct.getBarcode());
                lp.setArtists((String) productData.get("artists"));
                lp.setRecordLabel((String) productData.get("recordLabel"));
                lp.setTracklist((String) productData.get("tracklist"));
                lp.setGenre((String) productData.get("genre"));
                lp.setReleaseDate(new java.util.Date());
                lp.setProduct(savedProduct);
                lpRepository.save(lp);
                break;
            case "DVD":
                DVD dvd = new DVD();
                dvd.setBarcode(savedProduct.getBarcode());
                dvd.setDiscType((String) productData.get("discType"));
                dvd.setDirector((String) productData.get("director"));
                dvd.setRuntime(Integer.parseInt(productData.get("runtime").toString()));
                dvd.setStudio((String) productData.get("studio"));
                dvd.setLanguage((String) productData.get("language"));
                dvd.setSubtitles((String) productData.get("subtitles"));
                dvd.setReleaseDate(new java.util.Date());
                dvd.setGenre((String) productData.get("genre"));
                dvd.setProduct(savedProduct);
                dvdRepository.save(dvd);
                break;
        }

        ProductHistory history = new ProductHistory();
        history.setBarcode(savedProduct.getBarcode());
        history.setOperation("add");
        history.setDetails(productData.toString());
        productHistoryRepository.save(history);

        return ResponseEntity.ok(savedProduct);
    }

    @DeleteMapping("/{barcode}")
    @PreAuthorize("hasRole('PRODUCT_MANAGER')")
    public ResponseEntity<Void> deleteProduct(@PathVariable String barcode) {
        Product product = productRepository.findById(barcode).orElse(null);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }

        ProductHistory history = new ProductHistory();
        history.setBarcode(barcode);
        history.setOperation("delete");
        history.setDetails(product.toString());
        productHistoryRepository.save(history);

        productRepository.deleteById(barcode);
        return ResponseEntity.ok().build();
    }
}