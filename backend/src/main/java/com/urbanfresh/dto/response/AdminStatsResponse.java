package com.urbanfresh.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Response payload for the admin dashboard statistics endpoint.
 * Contains high-level platform counts used by the admin overview panel.
 */
@Getter
@Builder
public class AdminStatsResponse {

    /** Total number of registered users in the system. */
    private long totalUsers;

    /** Total number of products in the catalogue. */
    private long totalProducts;
}
