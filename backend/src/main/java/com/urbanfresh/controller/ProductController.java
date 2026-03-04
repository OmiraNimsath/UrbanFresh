package com.urbanfresh.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.urbanfresh.dto.response.ProductResponse;
import com.urbanfresh.service.ProductService;

import lombok.RequiredArgsConstructor;

/**
 * Controller Layer – Exposes public read-only product endpoints for the landing page.
 * No authentication is required; these routes are whitelisted in SecurityConfig.
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
}
