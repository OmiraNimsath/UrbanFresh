package com.urbanfresh.service;

import com.urbanfresh.dto.response.ExpiryBucketResponse;

/**
 * Expiry Service Interface
 * Layer: Service (Business Logic)
 * Detects near-expiry in-stock products and groups them into urgency buckets
 * for the admin expiry dashboard.
 */
public interface ExpiryService {

    /**
     * Returns in-stock approved products grouped into three non-overlapping
     * expiry urgency buckets: critical (0-1 days), urgent (2-7 days), warning (8-30 days).
     * A single DB query fetches all within 30 days; categorisation is done in-memory.
     *
     * @return ExpiryBucketResponse with three product lists and a total count
     */
    ExpiryBucketResponse getExpiryBuckets();
}
