package com.urbanfresh.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urbanfresh.dto.response.AdminStatsResponse;
import com.urbanfresh.service.AdminService;

import lombok.RequiredArgsConstructor;

/**
 * Controller Layer – ADMIN-only endpoints for platform management.
 * Protected by two independent layers:
 *   1. URL-level:    SecurityConfig restricts /api/admin/** to ROLE_ADMIN.
 *   2. Method-level: @PreAuthorize is defence-in-depth if URL rules are
 *                    misconfigured or bypassed.
 * Any valid JWT without ADMIN role receives 403 via RoleAccessDeniedHandler
 * (URL layer) or GlobalExceptionHandler (method layer).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    /**
     * Returns high-level platform statistics for the admin dashboard.
     * GET /api/admin/stats
     *
     * @return 200 OK  with totalUsers and totalProducts counts;
     *         403 Forbidden if the caller does not have ADMIN role
     */
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }
}
