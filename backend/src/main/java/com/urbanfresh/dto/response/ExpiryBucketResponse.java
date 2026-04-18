package com.urbanfresh.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO grouping near-expiry products into three urgency buckets.
 * Layer: DTO (Data Transfer Object)
 * Buckets are non-overlapping: critical (0-1 days), urgent (2-7 days), warning (8-30 days).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpiryBucketResponse {

    /** Products expiring today or tomorrow (0–1 days). */
    private List<ExpiryProductResponse> within1Day;

    /** Products expiring in 2 to 7 days. */
    private List<ExpiryProductResponse> within7Days;

    /** Products expiring in 8 to 30 days. */
    private List<ExpiryProductResponse> within30Days;

    /** Total in-stock products across all three buckets. */
    private int totalNearExpiryCount;
}
