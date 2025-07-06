package com.aims.service;

import com.aims.model.ProductHistory;
import com.aims.model.User;
import com.aims.repository.ProductHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProductHistoryService {
    private static final Logger logger = LoggerFactory.getLogger(ProductHistoryService.class);

    @Autowired
    private ProductHistoryRepository productHistoryRepository;

    public void recordProductOperation(String barcode, String operation, User user, String details) {
        if (barcode == null || barcode.trim().isEmpty()) {
            logger.error("Barcode không hợp lệ khi ghi lịch sử");
            throw new IllegalArgumentException("Barcode không hợp lệ");
        }
        if (operation == null || !List.of("add", "edit", "delete").contains(operation.toLowerCase())) {
            logger.error("Thao tác không hợp lệ: {}", operation);
            throw new IllegalArgumentException("Thao tác không hợp lệ");
        }

        ProductHistory history = new ProductHistory();
        history.setBarcode(barcode);
        history.setOperation(operation.toLowerCase()); // Chuyển thành chữ thường
        history.setUser(user);
        history.setOperationDate(LocalDateTime.now());
        history.setDetails(details);

        productHistoryRepository.save(history);
        logger.info("Đã ghi lịch sử thao tác: {} cho barcode: {}", operation, barcode);
    }

    public long countTodayOperations() {
        return productHistoryRepository.countTodayOperations();
    }

    public long countTodayPriceUpdates(String barcode) {
        if (barcode == null || barcode.trim().isEmpty()) {
            logger.error("Barcode không hợp lệ khi đếm cập nhật giá");
            throw new IllegalArgumentException("Barcode không hợp lệ");
        }
        return productHistoryRepository.countTodayPriceUpdatesByBarcode(barcode);
    }

    public long countTodayDeletions() {
        return productHistoryRepository.countTodayDeletions();
    }

    public Page<ProductHistory> getAllHistory(Pageable pageable) {
        Page<ProductHistory> history = productHistoryRepository.findAll(pageable);
        logger.info("Lấy tất cả lịch sử: tìm thấy {} bản ghi", history.getTotalElements());
        return history;
    }

    public Page<ProductHistory> getHistoryByBarcode(String barcode, Pageable pageable) {
        if (barcode == null || barcode.trim().isEmpty()) {
            logger.error("Barcode không hợp lệ khi lấy lịch sử");
            throw new IllegalArgumentException("Barcode không hợp lệ");
        }
        Page<ProductHistory> history = productHistoryRepository.findByBarcode(barcode, pageable);
        logger.info("Lấy lịch sử cho barcode '{}': tìm thấy {} bản ghi", barcode, history.getTotalElements());
        return history;
    }

    public Page<ProductHistory> getHistoryByUser(User user, Pageable pageable) {
        if (user == null) {
            logger.error("Người dùng không hợp lệ khi lấy lịch sử");
            throw new IllegalArgumentException("Người dùng không hợp lệ");
        }
        Page<ProductHistory> history = productHistoryRepository.findByUser(user, pageable);
        logger.info("Lấy lịch sử cho người dùng '{}': tìm thấy {} bản ghi", user.getEmail(), history.getTotalElements());
        return history;
    }
}
