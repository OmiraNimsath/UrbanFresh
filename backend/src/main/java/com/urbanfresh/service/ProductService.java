package com.urbanfresh.service;

import java.util.List;

import com.urbanfresh.dto.response.ProductPageResponse;
import com.urbanfresh.dto.response.ProductResponse;
import com.urbanfresh.dto.response.ProductSuggestionResponse;

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

    /**
     * Searches and filters the product catalogue with optional pagination.
     * Any combination of parameters is valid; null values skip that filter.
     *
     * @param search   substring to match in product name or description; null = no filter
     * @param category exact category to filter by; null = all categories
     * @param sortBy   field to sort by: "name", "price_asc", "price_desc" (default "name")
     * @param page     zero-based page index
     * @param size     number of items per page
     * @return paginated product results wrapped in ProductPageResponse
     */
    ProductPageResponse searchProducts(String search, String category, String sortBy, int page, int size);

    /**
     * Returns all distinct category names for the frontend filter dropdown.
     *
     * @return sorted list of category strings (empty list when none exist)
     */
    List<String> getCategories();

    /**
     * Returns up to 8 lightweight suggestion payloads for the autocomplete dropdown.
     * Each result carries the product id, name, thumbnail URL, price, and unit so the
     * frontend can render a rich preview row without a second request.
     * Returns an empty list when the query is blank or shorter than 2 characters.
     *
     * @param query the partial product name typed by the user
     * @return list of up to 8 ProductSuggestionResponse objects
     */
    List<ProductSuggestionResponse> getProductSuggestions(String query);

    /**
     * Returns a single product by its primary-key ID.
     * Used by the product detail page.
     *
     * @param id product identifier
     * @return the matching ProductResponse
     * @throws com.urbanfresh.exception.ProductNotFoundException when no product exists with that id
     */
    ProductResponse getProductById(Long id);
}
