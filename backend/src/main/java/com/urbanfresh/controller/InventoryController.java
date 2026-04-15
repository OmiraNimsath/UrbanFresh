package com.urbanfresh.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urbanfresh.dto.request.InventoryUpdateRequest;
import com.urbanfresh.dto.response.BatchResponse;
import com.urbanfresh.dto.response.InventoryResponse;
import com.urbanfresh.service.InventoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller Layer – Exposes admin-only REST endpoints for inventory management.
 * Handles HTTP concerns only; all business logic is delegated to InventoryService.
 * Security is enforced at the class level — every method requires the ADMIN role.
 * Layer: Controller
 */
@RestController
@RequestMapping("/api/admin/inventory")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    /**
     * Returns the complete inventory list with product name, current quantity,
     * reorder threshold, low-stock status, and audit metadata.
     *
     * @return 200 OK with a list of InventoryResponse, one entry per product
     */
    @GetMapping
    public ResponseEntity<List<InventoryResponse>> getInventory() {
        return ResponseEntity.ok(inventoryService.getAllInventory());
    }

    /**
     * Updates the stock quantity and reorder threshold for a specific product.
     * The authenticated admin's email is recorded as an audit trail entry.
     *
     * @param productId  path variable identifying the product to update
     * @param request    validated payload containing new quantity and reorderThreshold
     * @param auth       Spring Security authentication used to extract the admin's email
     * @return 200 OK with the updated InventoryResponse
     */
    @PutMapping("/{productId}")
    public ResponseEntity<InventoryResponse> updateInventory(
            @PathVariable Long productId,
            @Valid @RequestBody InventoryUpdateRequest request,
            Authentication auth) {
        return ResponseEntity.ok(
                inventoryService.updateInventory(productId, request, auth.getName()));
    }

    /**
     * Returns all batches for a product ordered by expiry date (oldest first).
     * Allows admin to inspect batch composition and identify near-expiry or quarantined batches.
     *
     * @param productId product ID whose batches to list
     * @return 200 OK with list of BatchResponse
     */
    @GetMapping("/{productId}/batches")
    public ResponseEntity<List<BatchResponse>> getProductBatches(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getProductBatches(productId));
    }

    /**
     * Quarantines a batch, removing it from FIFO allocation without deleting it.
     * Used when a batch has a quality issue. The batch remains visible in the batch
     * list with QUARANTINED status for audit purposes.
     *
     * @param productId product ID that owns the batch
     * @param batchId   batch ID to quarantine
     * @return 200 OK with the updated BatchResponse
     */
    @PatchMapping("/{productId}/batches/{batchId}/quarantine")
    public ResponseEntity<BatchResponse> quarantineBatch(
            @PathVariable Long productId,
            @PathVariable Long batchId) {
        return ResponseEntity.ok(inventoryService.quarantineBatch(productId, batchId));
    }
}
