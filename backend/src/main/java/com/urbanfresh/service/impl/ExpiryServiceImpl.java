package com.urbanfresh.service.impl;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.urbanfresh.dto.response.ExpiryBucketResponse;
import com.urbanfresh.dto.response.ExpiryProductResponse;
import com.urbanfresh.model.Brand;
import com.urbanfresh.model.Product;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.service.ExpiryService;

import lombok.RequiredArgsConstructor;

/**
 * Expiry Service Implementation
 * Layer: Service (Business Logic)
 * Fetches all in-stock approved products expiring within 30 days from a single
 * DB query, then partitions them into three non-overlapping urgency buckets
 * entirely in-memory to avoid multiple round-trips.
 */
@Service
@RequiredArgsConstructor
public class ExpiryServiceImpl implements ExpiryService {

    /** Outer window — products expiring beyond this are not near-expiry. */
    private static final int WINDOW_DAYS = 30;

    /** Threshold for the "urgent" bucket (2–7 days). */
    private static final int URGENT_THRESHOLD_DAYS = 7;

    /** Threshold for the "critical" bucket (0–1 day). */
    private static final int CRITICAL_THRESHOLD_DAYS = 1;

    private final ProductRepository productRepository;

    /**
     * Returns expiry buckets for the admin expiry dashboard.
     * One DB query fetches products expiring within 30 days;
     * Java stream partitioning splits them into critical/urgent/warning.
     *
     * @return ExpiryBucketResponse with three product lists and a combined total
     */
    @Override
    public ExpiryBucketResponse getExpiryBuckets() {
        LocalDate today = LocalDate.now();
        LocalDate cutoff = today.plusDays(WINDOW_DAYS);

        // Single query: all in-stock approved products in the 30-day window
        List<Product> products = productRepository
                .findByExpiryDateBetweenAndStockQuantityGreaterThanOrderByExpiryDateAsc(today, cutoff, 0);

        List<ExpiryProductResponse> within1Day = products.stream()
                .filter(p -> daysUntil(today, p) <= CRITICAL_THRESHOLD_DAYS)
                .map(p -> toExpiryResponse(p, today))
                .collect(Collectors.toList());

        List<ExpiryProductResponse> within7Days = products.stream()
                .filter(p -> {
                    long days = daysUntil(today, p);
                    // Non-overlapping: strictly between critical and urgent thresholds
                    return days > CRITICAL_THRESHOLD_DAYS && days <= URGENT_THRESHOLD_DAYS;
                })
                .map(p -> toExpiryResponse(p, today))
                .collect(Collectors.toList());

        List<ExpiryProductResponse> within30Days = products.stream()
                .filter(p -> daysUntil(today, p) > URGENT_THRESHOLD_DAYS)
                .map(p -> toExpiryResponse(p, today))
                .collect(Collectors.toList());

        int total = within1Day.size() + within7Days.size() + within30Days.size();

        return new ExpiryBucketResponse(within1Day, within7Days, within30Days, total);
    }

    /** Calculates days from today to the product's expiry date (0 = expires today). */
    private long daysUntil(LocalDate today, Product product) {
        return today.until(product.getExpiryDate()).getDays();
    }

    /** Maps a Product entity + computed daysUntilExpiry to the lightweight response DTO. */
    private ExpiryProductResponse toExpiryResponse(Product product, LocalDate today) {
        Brand brand = product.getBrand();
        return new ExpiryProductResponse(
                product.getId(),
                product.getName(),
                product.getCategory(),
                brand != null ? brand.getName() : null,
                product.getPrice(),
                product.getUnit(),
                product.getStockQuantity(),
                product.getExpiryDate(),
                daysUntil(today, product)
        );
    }
}
