package com.urbanfresh.controller;

import com.urbanfresh.dto.response.WasteReportResponse;
import com.urbanfresh.service.WasteReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Waste Report Controller
 * Layer: Controller (HTTP API)
 * Exposes the admin waste report endpoint.
 * URL security is already enforced at the filter chain level via /api/admin/**;
 * method-level @PreAuthorize provides defence-in-depth.
 */
@RestController
@RequestMapping("/api/admin/waste-report")
@RequiredArgsConstructor
public class WasteReportController {

    private final WasteReportService wasteReportService;

    /**
     * GET /api/admin/waste-report
     * Returns a full waste report: monthly summaries, top wasted products,
     * total waste value, total wasted units, and overall waste percentage.
     * Accessible to ADMIN role only.
     *
     * @return WasteReportResponse with all aggregated waste data
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WasteReportResponse> getWasteReport() {
        return ResponseEntity.ok(wasteReportService.getWasteReport());
    }
}
