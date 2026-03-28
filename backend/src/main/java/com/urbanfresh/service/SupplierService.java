package com.urbanfresh.service;

import java.util.List;

import com.urbanfresh.dto.response.BrandResponse;
import com.urbanfresh.dto.response.SupplierDashboardResponse;
import com.urbanfresh.dto.response.SupplierProductResponse;

/**
 * Service Layer – Supplier-facing operations with brand scoping.
 */
public interface SupplierService {

    /**
     * Retrieves aggregated metrics for the supplier dashboard.
     * 
     * @param supplierEmail authenticated supplier email
     * @return dashboard summary including brand names, sales, and restock counts
     */
    SupplierDashboardResponse getDashboardData(String supplierEmail);

    /**
     * Get all brands assigned to the authenticated supplier.
     *
     * @param supplierEmail authenticated supplier email
     * @return assigned brands
     */
    List<BrandResponse> getAssignedBrands(String supplierEmail);

    /**
     * Get products visible to the authenticated supplier.
     *
     * @param supplierEmail authenticated supplier email
     * @return brand-filtered products
     */
    List<SupplierProductResponse> getSupplierProducts(String supplierEmail);
}
