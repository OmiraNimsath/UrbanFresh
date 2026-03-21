package com.urbanfresh.service;

import com.urbanfresh.dto.AdminDashboardResponse;

/**
 * Admin Dashboard Service Interface
 * Layer: Service (Business Logic)
 * Provides KPI metrics and alert counts for admin dashboard
 */
public interface AdminDashboardService {
    
    /**
     * Retrieves admin dashboard metrics and alerts
     * @return AdminDashboardResponse containing KPIs and alert counts
     */
    AdminDashboardResponse getDashboardMetrics();
}
