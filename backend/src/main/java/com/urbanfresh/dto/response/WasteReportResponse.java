package com.urbanfresh.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Top-level response DTO for the admin waste report dashboard.
 * Layer: DTO (Data Transfer Object)
 * Aggregates expired in-stock products into summary metrics, monthly breakdowns,
 * and a ranked list of the most costly wasted products.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WasteReportResponse {

    /** Total monetary value of all expired in-stock approved products. */
    private BigDecimal totalWasteValue;

    /** Total number of wasted units across all expired products. */
    private int totalWastedUnits;

    /**
     * Overall waste as a percentage of total approved inventory value.
     * Computed as (totalWasteValue / totalApprovedInventoryValue) × 100.
     */
    private double overallWastePercentage;

    /** Monthly waste totals sorted in ascending chronological order (oldest first). */
    private List<WasteMonthSummaryResponse> monthlySummaries;

    /** Top wasted products ranked by waste value descending (up to 10 entries). */
    private List<WastedProductResponse> topWastedProducts;

    /** Timestamp when this report was generated. */
    private LocalDateTime generatedAt;
}
