package com.urbanfresh.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.urbanfresh.model.PricingUnit;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for a single product appearing in an expiry urgency bucket.
 * Layer: DTO (Data Transfer Object)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpiryProductResponse {

    private Long id;
    private String name;
    private String category;
    private String brandName;
    private BigDecimal price;
    private PricingUnit unit;
    private int stockQuantity;
    private LocalDate expiryDate;

    /** Days from today until this product expires; 0 means expires today. */
    private long daysUntilExpiry;

    /** Discount percentage (0-100) applied to this product; 0 means no discount. */
    private Integer discountPercentage;
}
