package com.urbanfresh.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Read-only response payload for a single product.
 * Used by the public landing page endpoints (featured and near-expiry).
 * Deliberately omits raw stockQuantity to avoid leaking warehouse data.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private String imageUrl;
    private boolean featured;

    /** Null when the product has no expiry (non-perishable). */
    private LocalDate expiryDate;

    /**
     * Derived availability flag — true when stockQuantity > 0.
     * Lets the frontend show/hide "Add to Cart" without exposing raw inventory numbers.
     */
    private boolean inStock;
}
