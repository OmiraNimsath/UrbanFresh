package com.urbanfresh.service;

import java.util.List;

import com.urbanfresh.dto.response.ProductResponse;

/**
 * Service Layer – Contract for product-related business operations.
 * Decouples the controller from the concrete implementation (SOLID: DIP).
 */
public interface ProductService {

    /**
     * Returns all products flagged as featured.
     * Used by the landing page "Featured Products" section.
     *
     * @return list of featured product responses (may be empty, never null)
     */
    List<ProductResponse> getFeaturedProducts();

    /**
     * Returns in-stock products expiring within the next {@code daysAhead} days.
     * Used by the landing page "Near-Expiry Offers" section.
     *
     * @param daysAhead look-ahead window in days (e.g. 7 means expiring within a week)
     * @return list of near-expiry products ordered by earliest expiry first
     */
    List<ProductResponse> getNearExpiryProducts(int daysAhead);
}
