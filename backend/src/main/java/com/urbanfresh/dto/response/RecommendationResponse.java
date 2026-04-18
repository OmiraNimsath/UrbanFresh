package com.urbanfresh.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Payload for a single "Buy Again" recommendation entry.
 * Returned by GET /api/customer/recommendations.
 * totalOrdered reflects how many times the customer has bought this product
 * across all confirmed orders — used for frequency-based ranking on the backend.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {

    private Long productId;
    private String name;
    private String imageUrl;
    private BigDecimal price;
    private int stockQuantity;
    /** Total units ordered by this customer across all confirmed orders — ranking signal. */
    private long totalOrdered;
}
