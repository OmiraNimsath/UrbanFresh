package com.urbanfresh.controller;

import com.urbanfresh.dto.AdminDashboardResponse;
import com.urbanfresh.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin Dashboard Controller
 * Layer: Controller (HTTP API)
 * Handles admin dashboard KPI and alert endpoints with role-based access
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {
    
    private final AdminDashboardService adminDashboardService;
    
    /**
     * Fetch admin dashboard metrics and alerts
     * Only accessible to ADMIN role
     * @return AdminDashboardResponse with KPIs and alert counts
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardResponse> getDashboardMetrics() {
        AdminDashboardResponse metrics = adminDashboardService.getDashboardMetrics();
        return ResponseEntity.ok(metrics);
    }
}
