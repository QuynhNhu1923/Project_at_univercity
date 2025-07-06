package com.aims.service;

import com.aims.model.Book;
import com.aims.model.CD;
import com.aims.model.LP;
import com.aims.model.DVD;
import com.aims.model.Product;
import com.aims.model.User;
import com.aims.repository.BookRepository;
import com.aims.repository.CDRepository;
import com.aims.repository.LPRepository;
import com.aims.repository.DVDRepository;
import com.aims.repository.ProductRepository;
import com.aims.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
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

    @Autowired
    private DVDRepository dvdRepository;

    @Autowired
    private ProductHistoryService productHistoryService;

    @Autowired
    private UserRepository userRepository;
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");


    public Page<Product> getAllProducts(int page, String sort, String barcode, String category) {
        Sort sortOrder = sort.equalsIgnoreCase("priceDesc") ? Sort.by("price").descending() : Sort.by("price").ascending();
        Pageable pageable = PageRequest.of(page, 20, sortOrder);
        Page<Product> products;

        if (barcode != null && !barcode.isEmpty()) {
            products = productRepository.findByBarcode(barcode, pageable);
            logger.info("Lấy sản phẩm theo barcode {}: tìm thấy {} sản phẩm", barcode, products.getTotalElements());
        } else if (category != null && !category.isEmpty()) {
            products = productRepository.findByCategory(category, pageable);
            logger.info("Lấy sản phẩm theo danh mục {}: tìm thấy {} sản phẩm", category, products.getTotalElements());
        } else {
            products = productRepository.findAll(pageable);
            logger.info("Lấy tất cả sản phẩm: tìm thấy {} sản phẩm cho trang {}", products.getTotalElements(), page);
        }
        return products;
    }

    public Page<Product> searchProducts(String query, int page, String sort) {
        if (query == null || query.trim().isEmpty()) {
            logger.warn("Từ khóa tìm kiếm không hợp lệ");
            throw new IllegalArgumentException("Từ khóa tìm kiếm không được để trống");
        }
        Sort sortOrder = sort.equalsIgnoreCase("priceDesc") ? Sort.by("price").descending() : Sort.by("price").ascending();
        Pageable pageable = PageRequest.of(page, 20, sortOrder);
        Page<Product> products = productRepository.findByTitleContainingIgnoreCase(query, pageable);
        logger.info("Tìm kiếm sản phẩm với từ khóa '{}': tìm thấy {} sản phẩm", query, products.getTotalElements());
        return products;
    }

    public Product getProductByBarcode(String barcode) {
        if (barcode == null || barcode.trim().isEmpty()) {
            logger.error("Barcode không hợp lệ");
            throw new IllegalArgumentException("Barcode không hợp lệ");
        }
        Product product = productRepository.findByBarcode(barcode);
        if (product == null) {
            logger.warn("Không tìm thấy sản phẩm với barcode: {}", barcode);
        } else {
            logger.info("Lấy sản phẩm theo barcode: {}", barcode);
        }
        return product;
    }

    public Map<String, Object> getPriceLimits(String barcode) {
        Product product = getProductByBarcode(barcode);
        if (product == null) {
            logger.warn("Không tìm thấy sản phẩm để lấy giới hạn giá: {}", barcode);
            throw new IllegalArgumentException("Không tìm thấy sản phẩm");
        }

        long todayPriceUpdates = productHistoryService.countTodayPriceUpdates(barcode);

        Map<String, Object> limits = new HashMap<>();
        limits.put("minPrice", product.getPrice() * 0.3);
        limits.put("maxPrice", product.getPrice() * 1.5);
        limits.put("updateCount", todayPriceUpdates);
        limits.put("maxUpdatesPerDay", 2);

        logger.info("Lấy giới hạn giá cho sản phẩm: {} (đã cập nhật {} lần hôm nay)", barcode, todayPriceUpdates);
        return limits;
    }

    public Long countTodayOperations() {
        logger.info("Đếm số thao tác trong ngày hiện tại");
        return productHistoryService.countTodayOperations();
    }

    public Product saveProduct(Map<String, Object> request, User user) {
        // Kiểm tra barcode
        String barcode = (String) request.get("barcode");
        if (barcode == null || barcode.isEmpty()) {
            logger.error("Barcode is missing in request");
            throw new IllegalArgumentException("Barcode is required");
        }
        if (productRepository.existsById(barcode)) {
            logger.error("Barcode đã tồn tại: {}", barcode);
            throw new IllegalArgumentException("Barcode already exists");
        }

        Product product = new Product();
        product.setBarcode(barcode);
        product.setTitle((String) request.get("title"));
        product.setCategory((String) request.get("category"));
        product.setValue(request.get("value") != null ? ((Number) request.get("value")).doubleValue() : 0.0);
        product.setPrice(request.get("price") != null ? ((Number) request.get("price")).doubleValue() : 0.0);
        product.setQuantity(request.get("quantity") != null ? ((Number) request.get("quantity")).intValue() : 0);
        product.setDimensions((String) request.get("dimensions"));
        product.setWeight(request.get("weight") != null ? ((Number) request.get("weight")).doubleValue() : 0.0);
        product.setDescription((String) request.get("description"));
        product.setCondition((String) request.get("condition"));
        product.setRushDelivery(request.get("rushDelivery") != null && (Boolean) request.get("rushDelivery"));
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());

        // Xử lý warehouseEntryDate
        try {
            String warehouseEntryDateStr = (String) request.get("warehouseEntryDate");
            if (warehouseEntryDateStr != null && !warehouseEntryDateStr.isEmpty()) {
                try {
                    product.setWarehouseEntryDate(LocalDateTime.parse(warehouseEntryDateStr, DATE_TIME_FORMATTER));
                } catch (DateTimeParseException e) {
                    // Thử định dạng yyyy-MM-dd
                    LocalDate date = LocalDate.parse(warehouseEntryDateStr, DATE_FORMATTER);
                    product.setWarehouseEntryDate(date.atStartOfDay());
                    logger.info("Converted date-only {} to LocalDateTime: {}", warehouseEntryDateStr, product.getWarehouseEntryDate());
                }
            } else {
                product.setWarehouseEntryDate(LocalDateTime.now());
                logger.info("No warehouse entry date provided, using current time: {}", product.getWarehouseEntryDate());
            }
        } catch (DateTimeParseException e) {
            logger.error("Invalid warehouse entry date format: {}", request.get("warehouseEntryDate"), e);
            throw new IllegalArgumentException("Invalid warehouse entry date format: " + request.get("warehouseEntryDate"));
        }

        // Lưu sản phẩm
        productRepository.save(product);
        logger.info("Đã lưu sản phẩm: {}", product.getBarcode());

        // Lưu chi tiết cụ thể
        @SuppressWarnings("unchecked")
        Map<String, Object> specificDetails = (Map<String, Object>) request.get("specificDetails");
        saveProductSpecificDetails(product, specificDetails);

        // Ghi lịch sử
        productHistoryService.recordProductOperation(
                product.getBarcode(),
                "add",
                user,
                "Added product: " + product.getTitle()
        );

        return product;
    }

    private void saveProductSpecificDetails(Product product, Map<String, Object> specificDetails) {
        if (specificDetails == null) {
            logger.warn("No specific details provided for product: {}", product.getBarcode());
            return;
        }

        String category = product.getCategory() != null ? product.getCategory().toUpperCase() : "";
        try {
            switch (category) {
                case "BOOK":
                    Book book = new Book();
                    book.setBarcode(product.getBarcode());
                    book.setProduct(product);
                    book.setAuthors((String) specificDetails.get("authors"));
                    book.setCoverType((String) specificDetails.get("coverType"));
                    book.setPublisher((String) specificDetails.get("publisher"));
                    book.setNumPages(specificDetails.get("numPages") != null ? ((Number) specificDetails.get("numPages")).intValue() : 0);
                    book.setLanguage((String) specificDetails.get("language"));
                    book.setGenre((String) specificDetails.get("genre"));
                    // Xử lý publicationDate
                    String publicationDateStr = (String) specificDetails.get("publicationDate");
                    if (publicationDateStr != null && !publicationDateStr.isEmpty()) {
                        try {
                            book.setPublicationDate(LocalDateTime.parse(publicationDateStr, DATE_TIME_FORMATTER));
                        } catch (DateTimeParseException e) {
                            LocalDate date = LocalDate.parse(publicationDateStr, DATE_FORMATTER);
                            book.setPublicationDate(date.atStartOfDay());
                            logger.info("Converted publication date {} to LocalDateTime: {}", publicationDateStr, book.getPublicationDate());
                        }
                    } else {
                        book.setPublicationDate(LocalDateTime.now());
                        logger.info("No publication date provided for book, using current time: {}", book.getPublicationDate());
                    }
                    bookRepository.save(book);
                    logger.info("Đã lưu thông tin sách cho barcode: {}", product.getBarcode());
                    break;

                case "CD":
                    CD cd = new CD();
                    cd.setBarcode(product.getBarcode());
                    cd.setProduct(product);
                    cd.setArtists((String) specificDetails.get("artists"));
                    cd.setRecordLabel((String) specificDetails.get("recordLabel"));
                    cd.setTracklist((String) specificDetails.get("tracklist"));
                    cd.setGenre((String) specificDetails.get("genre"));
                    // Xử lý releaseDate
                    String cdReleaseDateStr = (String) specificDetails.get("releaseDate");
                    if (cdReleaseDateStr != null && !cdReleaseDateStr.isEmpty()) {
                        try {
                            cd.setReleaseDate(LocalDateTime.parse(cdReleaseDateStr, DATE_TIME_FORMATTER));
                        } catch (DateTimeParseException e) {
                            LocalDate date = LocalDate.parse(cdReleaseDateStr, DATE_FORMATTER);
                            cd.setReleaseDate(date.atStartOfDay());
                            logger.info("Converted CD release date {} to LocalDateTime: {}", cdReleaseDateStr, cd.getReleaseDate());
                        }
                    } else {
                        cd.setReleaseDate(LocalDateTime.now());
                        logger.info("No release date provided for CD, using current time: {}", cd.getReleaseDate());
                    }
                    cdRepository.save(cd);
                    logger.info("Đã lưu thông tin CD cho barcode: {}", product.getBarcode());
                    break;

                case "LP":
                    LP lp = new LP();
                    lp.setBarcode(product.getBarcode());
                    lp.setProduct(product);
                    lp.setArtists((String) specificDetails.get("artists"));
                    lp.setRecordLabel((String) specificDetails.get("recordLabel"));
                    lp.setTracklist((String) specificDetails.get("tracklist"));
                    lp.setGenre((String) specificDetails.get("genre"));
                    // Xử lý releaseDate
                    String lpReleaseDateStr = (String) specificDetails.get("releaseDate");
                    if (lpReleaseDateStr != null && !lpReleaseDateStr.isEmpty()) {
                        try {
                            lp.setReleaseDate(LocalDateTime.parse(lpReleaseDateStr, DATE_TIME_FORMATTER));
                        } catch (DateTimeParseException e) {
                            LocalDate date = LocalDate.parse(lpReleaseDateStr, DATE_FORMATTER);
                            lp.setReleaseDate(date.atStartOfDay());
                            logger.info("Converted LP release date {} to LocalDateTime: {}", lpReleaseDateStr, lp.getReleaseDate());
                        }
                    } else {
                        lp.setReleaseDate(LocalDateTime.now());
                        logger.info("No release date provided for LP, using current time: {}", lp.getReleaseDate());
                    }
                    lpRepository.save(lp);
                    logger.info("Đã lưu thông tin LP cho barcode: {}", product.getBarcode());
                    break;

                case "DVD":
                    DVD dvd = new DVD();
                    dvd.setBarcode(product.getBarcode());
                    dvd.setProduct(product);
                    dvd.setDiscType((String) specificDetails.get("discType"));
                    dvd.setDirector((String) specificDetails.get("director"));
                    dvd.setRuntime(specificDetails.get("runtime") != null ? ((Number) specificDetails.get("runtime")).intValue() : 0);
                    dvd.setStudio((String) specificDetails.get("studio"));
                    dvd.setLanguage((String) specificDetails.get("language"));
                    dvd.setSubtitles((String) specificDetails.get("subtitles"));
                    dvd.setGenre((String) specificDetails.get("genre"));
                    // Xử lý releaseDate
                    String dvdReleaseDateStr = (String) specificDetails.get("releaseDate");
                    if (dvdReleaseDateStr != null && !dvdReleaseDateStr.isEmpty()) {
                        try {
                            dvd.setReleaseDate(LocalDateTime.parse(dvdReleaseDateStr, DATE_TIME_FORMATTER));
                        } catch (DateTimeParseException e) {
                            LocalDate date = LocalDate.parse(dvdReleaseDateStr, DATE_FORMATTER);
                            dvd.setReleaseDate(date.atStartOfDay());
                            logger.info("Converted DVD release date {} to LocalDateTime: {}", dvdReleaseDateStr, dvd.getReleaseDate());
                        }
                    } else {
                        dvd.setReleaseDate(LocalDateTime.now());
                        logger.info("No release date provided for DVD, using current time: {}", dvd.getReleaseDate());
                    }
                    dvdRepository.save(dvd);
                    logger.info("Đã lưu thông tin DVD cho barcode: {}", product.getBarcode());
                    break;

                default:
                    logger.warn("Không hỗ trợ danh mục: {}", category);
                    throw new IllegalArgumentException("Unsupported category: " + category);
            }
        } catch (Exception e) {
            logger.error("Lỗi khi lưu chi tiết sản phẩm cho barcode: {}", product.getBarcode(), e);
            throw new RuntimeException("Error saving product specific details", e);
        }
    }
    public void deleteProduct(String barcode) {
        if (barcode == null || barcode.trim().isEmpty()) {
            logger.error("Barcode không hợp lệ khi xóa");
            throw new IllegalArgumentException("Barcode không hợp lệ");
        }

        long todayDeletions = productHistoryService.countTodayDeletions();
        if (todayDeletions >= 30) {
            throw new IllegalArgumentException("Đã đạt giới hạn 30 lần xóa trong ngày");
        }

        bookRepository.deleteById(barcode);
        cdRepository.deleteById(barcode);
        lpRepository.deleteById(barcode);
        dvdRepository.deleteById(barcode);

        productRepository.deleteByBarcode(barcode);

        // Lấy thông tin người dùng từ SecurityContext
        User user = null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String email = ((UserDetails) principal).getUsername();
            user = userRepository.findByEmail(email).orElse(null);
        }

        productHistoryService.recordProductOperation(
                barcode,
                "delete",
                user,
                "Xóa sản phẩm"
        );

        logger.info("Đã xóa sản phẩm: {}", barcode);
    }

    public void updateProductPrice(String barcode, double newPrice) {
        Product product = getProductByBarcode(barcode);
        if (product == null) {
            throw new IllegalArgumentException("Không tìm thấy sản phẩm");
        }

        long todayPriceUpdates = productHistoryService.countTodayPriceUpdates(barcode);
        if (todayPriceUpdates >= 2) {
            throw new IllegalArgumentException("Đã đạt giới hạn 2 lần cập nhật giá trong ngày");
        }

        double minPrice = product.getValue() * 0.3;
        double maxPrice = product.getValue() * 1.5;
        if (newPrice < minPrice || newPrice > maxPrice) {
            throw new IllegalArgumentException(
                    String.format("Giá phải nằm trong khoảng %.2f - %.2f VND", minPrice, maxPrice)
            );
        }

        double oldPrice = product.getPrice();
        product.setPrice(newPrice);
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);

        // Lấy thông tin người dùng từ SecurityContext
        User user = null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String email = ((UserDetails) principal).getUsername();
            user = userRepository.findByEmail(email).orElse(null);
        }

        productHistoryService.recordProductOperation(
                barcode,
                "edit",
                user,
                String.format("Cập nhật giá từ %.2f thành %.2f", oldPrice, newPrice)
        );

        logger.info("Đã cập nhật giá sản phẩm {}: {} -> {}", barcode, oldPrice, newPrice);
    }

    public Page<Product> findByBarcodeContainingIgnoreCase(String barcode, Pageable pageable) {
        if (barcode == null || barcode.trim().isEmpty()) {
            logger.warn("Từ khóa tìm kiếm barcode không hợp lệ");
            throw new IllegalArgumentException("Từ khóa tìm kiếm barcode không được để trống");
        }
        Page<Product> products = productRepository.findByBarcodeContainingIgnoreCase(barcode, pageable);
        logger.info("Tìm kiếm sản phẩm theo barcode '{}': tìm thấy {} sản phẩm", barcode, products.getTotalElements());
        return products;
    }

    public Page<Product> findByTitleContainingIgnoreCase(String title, Pageable pageable) {
        if (title == null || title.trim().isEmpty()) {
            logger.warn("Từ khóa tìm kiếm title không hợp lệ");
            throw new IllegalArgumentException("Từ khóa tìm kiếm title không được để trống");
        }
        Page<Product> products = productRepository.findByTitleContainingIgnoreCase(title, pageable);
        logger.info("Tìm kiếm sản phẩm theo title '{}': tìm thấy {} sản phẩm", title, products.getTotalElements());
        return products;
    }

    public Page<Product> findByCategoryContainingIgnoreCase(String category, Pageable pageable) {
        if (category == null || category.trim().isEmpty()) {
            logger.warn("Từ khóa tìm kiếm category không hợp lệ");
            throw new IllegalArgumentException("Từ khóa tìm kiếm category không được để trống");
        }
        Page<Product> products = productRepository.findByCategoryContainingIgnoreCase(category, pageable);
        logger.info("Tìm kiếm sản phẩm theo category '{}': tìm thấy {} sản phẩm", category, products.getTotalElements());
        return products;
    }

    public Page<Product> findByBarcodeContainingIgnoreCaseOrTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase(
            String barcode, String title, String category, Pageable pageable) {
        if (barcode == null || barcode.trim().isEmpty()) {
            logger.warn("Từ khóa tìm kiếm barcode không hợp lệ");
            throw new IllegalArgumentException("Từ khóa tìm kiếm barcode không được để trống");
        }
        Page<Product> products = productRepository.findByBarcodeContainingIgnoreCaseOrTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase(
                barcode, title, category, pageable);
        logger.info("Tìm kiếm tổng hợp với barcode '{}', title '{}', category '{}': tìm thấy {} sản phẩm",
                barcode, title, category, products.getTotalElements());
        return products;
    }

    public Map<String, Object> getProductDetailsWithSpecifics(String barcode) {
        if (barcode == null || barcode.trim().isEmpty()) {
            logger.error("Barcode không hợp lệ");
            throw new IllegalArgumentException("Barcode không hợp lệ");
        }

        Product product = productRepository.findByBarcode(barcode);
        if (product == null) {
            logger.warn("Không tìm thấy sản phẩm với barcode: {}", barcode);
            return new HashMap<>();
        }

        Map<String, Object> details = new HashMap<>();
        details.put("barcode", product.getBarcode());
        details.put("title", product.getTitle());
        details.put("category", product.getCategory());
        details.put("value", product.getValue());
        details.put("price", product.getPrice());
        details.put("quantity", product.getQuantity());
        details.put("warehouseEntryDate", product.getWarehouseEntryDate());
        details.put("dimensions", product.getDimensions());
        details.put("weight", product.getWeight());
        details.put("description", product.getDescription());
        details.put("condition", product.getCondition());
        details.put("rushDelivery", product.isRushDelivery());

        switch (product.getCategory()) {
            case "Book":
                Book book = bookRepository.findById(barcode).orElse(null);
                if (book != null) {
                    details.put("authors", book.getAuthors());
                    details.put("coverType", book.getCoverType());
                    details.put("publisher", book.getPublisher());
                    details.put("publicationDate", book.getPublicationDate());
                    details.put("numPages", book.getNumPages());
                    details.put("language", book.getLanguage());
                    details.put("genre", book.getGenre());
                }
                break;
            case "CD":
                CD cd = cdRepository.findById(barcode).orElse(null);
                if (cd != null) {
                    details.put("artists", cd.getArtists());
                    details.put("recordLabel", cd.getRecordLabel());
                    details.put("tracklist", cd.getTracklist());
                    details.put("genre", cd.getGenre());
                    details.put("releaseDate", cd.getReleaseDate());
                }
                break;
            case "LP":
                LP lp = lpRepository.findById(barcode).orElse(null);
                if (lp != null) {
                    details.put("artists", lp.getArtists());
                    details.put("recordLabel", lp.getRecordLabel());
                    details.put("tracklist", lp.getTracklist());
                    details.put("genre", lp.getGenre());
                    details.put("releaseDate", lp.getReleaseDate());
                }
                break;
            case "DVD":
                DVD dvd = dvdRepository.findById(barcode).orElse(null);
                if (dvd != null) {
                    details.put("discType", dvd.getDiscType());
                    details.put("director", dvd.getDirector());
                    details.put("runtime", dvd.getRuntime());
                    details.put("studio", dvd.getStudio());
                    details.put("language", dvd.getLanguage());
                    details.put("subtitles", dvd.getSubtitles());
                    details.put("releaseDate", dvd.getReleaseDate());
                    details.put("genre", dvd.getGenre());
                }
                break;
            default:
                logger.warn("Danh mục không được hỗ trợ: {}", product.getCategory());
        }

        logger.info("Lấy chi tiết sản phẩm cho barcode: {}", barcode);
        return details;
    }

    public void deleteProducts(List<String> barcodes) {
        if (barcodes == null || barcodes.isEmpty()) {
            logger.error("Danh sách barcode không hợp lệ");
            throw new IllegalArgumentException("Danh sách barcode không được để trống");
        }

        long todayDeletions = productHistoryService.countTodayDeletions();
        if (todayDeletions + barcodes.size() > 30) {
            logger.warn("Vượt quá giới hạn 30 lần xóa trong ngày. Hiện tại: {}, yêu cầu: {}", todayDeletions, barcodes.size());
            throw new IllegalArgumentException("Vượt quá giới hạn 30 lần xóa trong ngày");
        }

        // Lấy thông tin người dùng từ SecurityContext
        User user = null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String email = ((UserDetails) principal).getUsername();
            user = userRepository.findByEmail(email).orElse(null);
        }

        for (String barcode : barcodes) {
            if (barcode == null || barcode.trim().isEmpty()) {
                logger.warn("Barcode không hợp lệ: {}", barcode);
                continue;
            }

            if (!productRepository.existsByBarcode(barcode)) {
                logger.warn("Không tìm thấy sản phẩm với barcode: {}", barcode);
                continue;
            }

            bookRepository.deleteById(barcode);
            cdRepository.deleteById(barcode);
            lpRepository.deleteById(barcode);
            dvdRepository.deleteById(barcode);

            productRepository.deleteByBarcode(barcode);

            productHistoryService.recordProductOperation(
                    barcode,
                    "delete",
                    user,
                    "Xóa sản phẩm trong batch delete"
            );

            logger.info("Đã xóa sản phẩm: {}", barcode);
        }
    }
}