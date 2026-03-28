package com.urbanfresh.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urbanfresh.dto.response.BrandResponse;
import com.urbanfresh.dto.response.SupplierDashboardResponse;
import com.urbanfresh.dto.response.SupplierProductResponse;
import com.urbanfresh.service.SupplierService;

import lombok.RequiredArgsConstructor;

/**
 * Controller Layer – Supplier-only endpoints for scoped dashboard data.
 */
@RestController
@RequestMapping("/api/supplier")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPPLIER')")
public class SupplierController {

    private final SupplierService supplierService;

    /**
     * Retrieves aggregated metrics for the supplier dashboard.
     *
     * @param authentication authenticated supplier principal
     * @return dashboard summary including brand names, sales, and restock counts
     */
    @GetMapping("/dashboard")
    public ResponseEntity<SupplierDashboardResponse> getDashboardData(Authentication authentication) {
        return ResponseEntity.ok(supplierService.getDashboardData(authentication.getName()));
    }

    /**
     * Returns brands assigned to the authenticated supplier.
     *
     * @param authentication authenticated supplier principal
     * @return assigned brands list
     */
    @GetMapping("/brands")
    public ResponseEntity<List<BrandResponse>> getAssignedBrands(Authentication authentication) {
        return ResponseEntity.ok(supplierService.getAssignedBrands(authentication.getName()));
    }

    /**
     * Returns products scoped to the authenticated supplier's assigned brands.
     *
     * @param authentication authenticated supplier principal
     * @return supplier product list
     */
    @GetMapping("/products")
    public ResponseEntity<List<SupplierProductResponse>> getSupplierProducts(Authentication authentication) {
        return ResponseEntity.ok(supplierService.getSupplierProducts(authentication.getName()));
    }
}
