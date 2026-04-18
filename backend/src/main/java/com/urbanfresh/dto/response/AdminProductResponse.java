package com.urbanfresh.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.urbanfresh.model.PricingUnit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Admin view of a single product.
 * Extends the public ProductResponse by exposing raw stockQuantity and
 * audit timestamps — fields that are intentionally hidden from customers.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminProductResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private PricingUnit unit;
    private String category;
    private Long brandId;
    private String brandName;
    private String brandCode;
    private String imageUrl;
    private boolean featured;
    private boolean hidden;
    private LocalDate expiryDate;

    /**
     * Earliest expiry date across all allocatable batches for this product.
     * Null when no batches exist. Preferred over expiryDate for batch-tracked products.
     */
    private LocalDate earliestExpiryDate;

    /** Discount percentage (0-100) applied to this product; 0 means no discount. */
    private Integer discountPercentage;

    /** Raw warehouse count — visible to admins only to support inventory management. */
    private int stockQuantity;

    private String approvalStatus;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
