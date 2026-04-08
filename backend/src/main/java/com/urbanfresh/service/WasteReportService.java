package com.urbanfresh.service;

import com.urbanfresh.dto.response.WasteReportResponse;

/**
 * Waste Report Service Interface
 * Layer: Service (Business Logic)
 * Aggregates expired in-stock product data into waste metrics for the admin dashboard.
 */
public interface WasteReportService {

    /**
     * Builds a complete waste report by querying all approved products that
     * expired with remaining stock, then computing monthly summaries, top
     * wasted products (ranked by waste value), and an overall waste percentage.
     *
     * @return WasteReportResponse containing totals, monthly breakdown, and top wasted products
     */
    WasteReportResponse getWasteReport();
}
