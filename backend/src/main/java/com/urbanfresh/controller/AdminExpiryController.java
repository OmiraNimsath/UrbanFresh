package com.urbanfresh.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urbanfresh.dto.response.ExpiryBucketResponse;
import com.urbanfresh.service.ExpiryService;

import lombok.RequiredArgsConstructor;

/**
 * Admin Expiry Controller
 * Layer: Controller (HTTP API)
 * Exposes the expiry bucket endpoint for the admin expiry dashboard.
 * Restricted to ADMIN role via URL-level security + @PreAuthorize.
 */
@RestController
@RequestMapping("/api/admin/expiry")
@RequiredArgsConstructor
public class AdminExpiryController {

    private final ExpiryService expiryService;

    /**
     * GET /api/admin/expiry/buckets
     * Returns in-stock approved products grouped into three urgency buckets:
     * critical (0-1 days), urgent (2-7 days), warning (8-30 days).
     *
     * @return 200 with ExpiryBucketResponse
     */
    @GetMapping("/buckets")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ExpiryBucketResponse> getExpiryBuckets() {
        return ResponseEntity.ok(expiryService.getExpiryBuckets());
    }
}
