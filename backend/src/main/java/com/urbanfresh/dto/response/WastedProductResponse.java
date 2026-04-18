package com.urbanfresh.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.urbanfresh.model.PricingUnit;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO representing a single expired product that contributed to stock waste.
 * Layer: DTO (Data Transfer Object)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WastedProductResponse {

    private Long productId;
    private String productName;
    private String category;
    private String brandName;
    private BigDecimal price;
    private PricingUnit unit;

    /** Remaining stock at report time — units that could not be sold before expiry. */
    private int wastedQuantity;

    /** Monetary value of the wasted stock: price × wastedQuantity. */
    private BigDecimal wastedValue;

    private LocalDate expiryDate;

    /** ISO year-month key (e.g. "2026-01") used for client-side grouping. */
    private String monthYear;
}
