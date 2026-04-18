package com.urbanfresh.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO summarising waste data for a single calendar month.
 * Layer: DTO (Data Transfer Object)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WasteMonthSummaryResponse {

    /** ISO year-month string (e.g. "2026-01") — used for chronological sorting. */
    private String monthYear;

    /** Human-readable display label (e.g. "Jan 2026") — used on chart axes. */
    private String monthLabel;

    /** Total monetary waste value for this month (sum of price × wasted quantity). */
    private BigDecimal wasteValue;

    /** Number of distinct products that expired with remaining stock this month. */
    private int wastedProductCount;

    /**
     * Percentage of the grand total waste attributed to this month.
     * Computed as (monthWasteValue / totalWasteValue) × 100.
     * Helps identify which months drove the most loss.
     */
    private double wastePercentage;
}
