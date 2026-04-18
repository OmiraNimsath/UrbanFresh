package com.urbanfresh.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.urbanfresh.model.PricingUnit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Read-only response payload for a single product.
 * Used by the public landing page endpoints (featured and near-expiry).
 * Deliberately omits raw stockQuantity to avoid leaking warehouse data.
 * Exposes batch-aware expiry info (earliestExpiryDate, hasNearExpiryBatches)
 * without revealing batch numbers or internal inventory structure.
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
    private PricingUnit unit;
    private String category;
    private String imageUrl;
    private boolean featured;

    /**
     * Legacy single expiry date (still populated for non-batch products).
     * For batch-tracked products, prefer earliestExpiryDate.
     */
    private LocalDate expiryDate;

    /** Discount percentage (0-100) applied to this product; 0 means no discount. */
    private Integer discountPercentage;

    /**
     * True when at least 1 unit is in stock. Used to flag out-of-stock items in the cart UI.
     */
    private boolean inStock;

    /**
     * Available stock count shown to customers on listing and detail pages.
     * Derived from batch stock (or legacy stockQuantity for non-batch products).
     */
    private int stockQuantity;

    /**
     * Earliest expiry date across all allocatable batches for this product.
     * Null for legacy products with no tracked batches.
     * Drives the "expires soon" label on the product card.
     */
    private LocalDate earliestExpiryDate;

    /**
     * True when any allocatable batch has an expiry date within 7 days.
     * Drives the near-expiry discount badge on the product card.
     */
    private boolean hasNearExpiryBatches;
}
