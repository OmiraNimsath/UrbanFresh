package com.urbanfresh.service;

import java.util.List;

import com.urbanfresh.dto.response.RecommendationResponse;

/**
 * Service Layer – Contract for habit-based product recommendations.
 * Returns the customer's most-frequently-purchased products that are
 * still available (in stock, not hidden) to power the "Buy Again" section.
 */
public interface RecommendationService {

    /**
     * Return up to 5 products most frequently purchased by the customer,
     * ranked by total units ordered across all confirmed orders.
     * Hidden products and out-of-stock items are excluded.
     *
     * @param customerEmail email from JWT principal
     * @return ordered list of recommendations (up to 5 items; empty when no history)
     */
    List<RecommendationResponse> getRecommendations(String customerEmail);
}
