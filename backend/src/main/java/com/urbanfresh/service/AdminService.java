package com.urbanfresh.service;

import com.urbanfresh.dto.response.AdminStatsResponse;

/**
 * Service Layer – Defines admin-specific business operations.
 * Callers must hold ADMIN role; enforced by SecurityConfig URL rules and
 * @PreAuthorize in AdminController before this layer is reached.
 */
public interface AdminService {

    /**
     * Retrieve high-level platform statistics for the admin dashboard.
     *
     * @return aggregated counts of users and products
     */
    AdminStatsResponse getStats();
}
