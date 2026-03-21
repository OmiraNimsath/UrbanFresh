package com.urbanfresh.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Admin Dashboard DTO - contains KPI metrics and alerts
 * Layer: DTO (Data Transfer Object)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {
    
    // KPI Metrics
    private long totalOrders;
    private double totalRevenue;
    private int activeSuppliersCount;
    private int totalProductsCount;
    
    // Alerts
    private int lowStockItemsCount;
    private int nearExpiryItemsCount;
    private double wastePercentage;
    
    // Summary
    private DashboardSummary summary;
    
    /**
     * Summary card for quick overview
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardSummary {
        private String lastUpdated;
        private String statusMessage;
    }
}
