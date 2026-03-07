package com.urbanfresh.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.urbanfresh.dto.response.ProductPageResponse;
import com.urbanfresh.dto.response.ProductResponse;
import com.urbanfresh.service.ProductService;

import lombok.RequiredArgsConstructor;

/**
 * Controller Layer – Exposes public read-only product endpoints.
 * Covers the landing page (featured, near-expiry) and the product listing page
 * (search, filter, sort, pagination). No authentication is required;
 * all routes here are whitelisted in SecurityConfig.
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /**
     * Returns all products flagged as featured.
     * GET /api/products/featured
     *
     * @return 200 with list of featured products (empty array when none exist)
     */
    @GetMapping("/featured")
    public ResponseEntity<List<ProductResponse>> getFeaturedProducts() {
        return ResponseEntity.ok(productService.getFeaturedProducts());
    }

    /**
     * Returns in-stock products expiring within a configurable look-ahead window.
     * GET /api/products/near-expiry?days=7
     *
     * @param days number of days ahead to look (default 7, clamped to 1–30)
     * @return 200 with near-expiry products ordered by earliest expiry date first
     */
    @GetMapping("/near-expiry")
    public ResponseEntity<List<ProductResponse>> getNearExpiryProducts(
            @RequestParam(defaultValue = "7") int days) {

        // Clamp to a safe range to prevent accidental full-table scans on bad input
        int safeDays = Math.max(1, Math.min(days, 30));
        return ResponseEntity.ok(productService.getNearExpiryProducts(safeDays));
    }

    /**
     * Searches the full product catalogue with optional search, category filter,
     * sort, and pagination.
     * GET /api/products?search=&category=&sortBy=&page=0&size=12
     *
     * @param search   substring to match in name/description; omit for all products
     * @param category category name to filter by; omit for all categories
     * @param sortBy   "price_asc" | "price_desc" | omit for name A–Z
     * @param page     zero-based page index (default 0)
     * @param size     items per page (default 12, clamped to 1–50)
     * @return 200 with paginated ProductPageResponse
     */
    @GetMapping
    public ResponseEntity<ProductPageResponse> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        // Clamp page size to prevent oversized payloads
        int safeSize = Math.max(1, Math.min(size, 50));
        int safePage = Math.max(0, page);
        return ResponseEntity.ok(productService.searchProducts(search, category, sortBy, safePage, safeSize));
    }

    /**
     * Returns all distinct category values for the frontend filter dropdown.
     * GET /api/products/categories
     *
     * @return 200 with sorted list of category strings (empty array when none exist)
     */
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(productService.getCategories());
    }

    /**
     * Returns up to 8 lightweight product suggestion payloads for the search autocomplete
     * dropdown. Each result carries id, name, imageUrl, price, and unit — enough to render
     * a rich preview row in the frontend without a second request.
     * Intentionally separate from GET /api/products so typing never triggers a grid reload.
     * GET /api/products/suggestions?q=milk
     *
     * @param q the partial query string typed by the user (min 2 chars enforced in service)
     * @return 200 with a list of up to 8 ProductSuggestionResponse objects
     */
    @GetMapping("/suggestions")
    public ResponseEntity<List<com.urbanfresh.dto.response.ProductSuggestionResponse>> getProductSuggestions(
            @RequestParam(required = false, defaultValue = "") String q) {
        return ResponseEntity.ok(productService.getProductSuggestions(q));
    }

    /**
     * Returns the full details of a single product by ID.
     * GET /api/products/{id}
     *
     * @param id product primary key from the URL path
     * @return 200 with ProductResponse, or 404 if the product does not exist
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }
}
