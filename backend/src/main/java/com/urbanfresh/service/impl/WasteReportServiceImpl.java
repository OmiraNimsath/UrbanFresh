package com.urbanfresh.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.response.WasteMonthSummaryResponse;
import com.urbanfresh.dto.response.WasteReportResponse;
import com.urbanfresh.dto.response.WastedProductResponse;
import com.urbanfresh.model.Brand;
import com.urbanfresh.model.Product;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.service.WasteReportService;

import lombok.RequiredArgsConstructor;

/**
 * Waste Report Service Implementation
 * Layer: Service (Business Logic)
 * Fetches all approved products that expired with remaining stock in a single DB query,
 * then computes monthly summaries and ranks the top wasted products entirely in-memory
 * to avoid multiple round-trips.
 */
@Service
@RequiredArgsConstructor
public class WasteReportServiceImpl implements WasteReportService {

    /** Maximum number of products shown in the "top wasted" ranking. */
    private static final int TOP_WASTED_LIMIT = 10;

    /** Scale used for all BigDecimal division operations. */
    private static final int SCALE = 2;

    /** Formatter for ISO year-month keys used in grouping (e.g. "2026-01"). */
    private static final DateTimeFormatter MONTH_KEY_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM");

    /** Formatter for human-readable month labels on chart axes (e.g. "Jan 2026"). */
    private static final DateTimeFormatter MONTH_LABEL_FMT =
            DateTimeFormatter.ofPattern("MMM yyyy");

    private final ProductRepository productRepository;

    /**
     * Builds the full waste report.
     * Steps:
     *  1. Load all APPROVED products with expiryDate < today and stockQuantity > 0.
     *  2. Map each to a WastedProductResponse (wasteValue = price × wastedQuantity).
     *  3. Compute total waste value and total wasted units.
     *  4. Group by month and compute per-month summaries with waste percentages.
     *  5. Rank all wasted products by wastedValue DESC; take top-10.
     *  6. Compute overall waste % against total approved inventory value.
     *
     * @return WasteReportResponse fully populated report
     */
    @Override
    @Transactional(readOnly = true)
    public WasteReportResponse getWasteReport() {
        LocalDate today = LocalDate.now();

        // Single query: expired, approved, in-stock products
        List<Product> expiredProducts =
                productRepository.findExpiredWithRemainingStock(today, 0);

        List<WastedProductResponse> wastedProducts = expiredProducts.stream()
                .map(this::toWastedProductResponse)
                .collect(Collectors.toList());

        BigDecimal totalWasteValue = wastedProducts.stream()
                .map(WastedProductResponse::getWastedValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalWastedUnits = wastedProducts.stream()
                .mapToInt(WastedProductResponse::getWastedQuantity)
                .sum();

        List<WasteMonthSummaryResponse> monthlySummaries =
                buildMonthlySummaries(wastedProducts, totalWasteValue);

        List<WastedProductResponse> topWasted = wastedProducts.stream()
                .sorted(Comparator.comparing(WastedProductResponse::getWastedValue).reversed())
                .limit(TOP_WASTED_LIMIT)
                .collect(Collectors.toList());

        double overallWastePercentage = computeOverallWastePercentage(totalWasteValue);

        return WasteReportResponse.builder()
                .totalWasteValue(totalWasteValue)
                .totalWastedUnits(totalWastedUnits)
                .overallWastePercentage(overallWastePercentage)
                .monthlySummaries(monthlySummaries)
                .topWastedProducts(topWasted)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Maps a Product entity to a WastedProductResponse.
     * wastedValue = price × stockQuantity (residual units lost to expiry).
     */
    private WastedProductResponse toWastedProductResponse(Product product) {
        Brand brand = product.getBrand();
        BigDecimal wastedValue = product.getPrice()
                .multiply(BigDecimal.valueOf(product.getStockQuantity()))
                .setScale(SCALE, RoundingMode.HALF_UP);

        String monthYear = product.getExpiryDate().format(MONTH_KEY_FMT);

        return new WastedProductResponse(
                product.getId(),
                product.getName(),
                product.getCategory(),
                brand != null ? brand.getName() : null,
                product.getPrice(),
                product.getUnit(),
                product.getStockQuantity(),
                wastedValue,
                product.getExpiryDate(),
                monthYear
        );
    }

    /**
     * Groups wasted products by their monthYear key and builds a sorted summary list.
     * Each month's wastePercentage is relative to the grand total waste value.
     * Months are sorted chronologically (oldest first) for chart display.
     *
     * @param wastedProducts  all wasted product rows
     * @param totalWasteValue grand total to use as percentage denominator
     * @return list of WasteMonthSummaryResponse sorted by monthYear ASC
     */
    private List<WasteMonthSummaryResponse> buildMonthlySummaries(
            List<WastedProductResponse> wastedProducts,
            BigDecimal totalWasteValue) {

        // Group by "yyyy-MM" key so months are correctly ordered lexicographically
        Map<String, List<WastedProductResponse>> byMonth = wastedProducts.stream()
                .collect(Collectors.groupingBy(WastedProductResponse::getMonthYear));

        return byMonth.entrySet().stream()
                .map(entry -> {
                    String key = entry.getKey();
                    List<WastedProductResponse> monthly = entry.getValue();

                    BigDecimal monthWasteValue = monthly.stream()
                            .map(WastedProductResponse::getWastedValue)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    double wastePercentage = computePercentage(monthWasteValue, totalWasteValue);

                    // Convert "yyyy-MM" key to human-readable label "MMM yyyy"
                    String monthLabel = LocalDate.parse(key + "-01").format(MONTH_LABEL_FMT);

                    return new WasteMonthSummaryResponse(
                            key,
                            monthLabel,
                            monthWasteValue,
                            monthly.size(),
                            wastePercentage
                    );
                })
                // Lexicographic sort on "yyyy-MM" is identical to chronological order
                .sorted(Comparator.comparing(WasteMonthSummaryResponse::getMonthYear))
                .collect(Collectors.toList());
    }

    /**
     * Computes the overall waste percentage:
     *   (totalWasteValue / totalApprovedInventoryValue) × 100.
     * Returns 0.0 when inventory value is zero or null (avoids division-by-zero).
     */
    private double computeOverallWastePercentage(BigDecimal totalWasteValue) {
        BigDecimal inventoryValue = productRepository.sumApprovedInventoryValue();
        if (inventoryValue == null || inventoryValue.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return computePercentage(totalWasteValue, inventoryValue);
    }

    /**
     * Computes (numerator / denominator) × 100, rounded to 2 decimal places.
     * Returns 0.0 when denominator is zero to prevent ArithmeticException.
     */
    private double computePercentage(BigDecimal numerator, BigDecimal denominator) {
        if (denominator.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return numerator
                .multiply(BigDecimal.valueOf(100))
                .divide(denominator, SCALE, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
