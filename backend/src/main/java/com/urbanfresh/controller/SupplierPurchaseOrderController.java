package com.urbanfresh.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import com.urbanfresh.dto.request.UpdatePurchaseOrderStatusDto;
import com.urbanfresh.dto.response.PurchaseOrderDto;
import com.urbanfresh.service.SupplierPurchaseOrderService;

import lombok.RequiredArgsConstructor;

/**
 * Controller Layer - Exposes endpoints for managing purchase orders 
 * strictly for authenticated suppliers.
 */
@RestController
@RequestMapping("/api/supplier/purchase-orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPPLIER')")
public class SupplierPurchaseOrderController {

    private final SupplierPurchaseOrderService purchaseOrderService;

    /**
     * View all purchase orders assigned to the supplier's associated brands.
     *
     * @param authentication the authenticated supplier principal
     * @return a list of scoped purchase orders
     */
    @GetMapping
    public ResponseEntity<List<PurchaseOrderDto>> listPurchaseOrders(Authentication authentication) {
        return ResponseEntity.ok(purchaseOrderService.getPurchaseOrdersForSupplier(authentication.getName()));
    }

    /**
     * Update the shipment status and estimated delivery timeline of a purchase order.
     * Enforces that the purchase order belongs to a brand mapped to the supplier.
     *
     * @param id             the ID of the purchase order
     * @param updateDto      payload containing the new status and timeline
     * @param authentication the authenticated supplier principal
     * @return the updated purchase order
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<PurchaseOrderDto> updatePurchaseOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePurchaseOrderStatusDto updateDto,
            Authentication authentication) {
        
        PurchaseOrderDto updatedOrder = purchaseOrderService.updateShipmentStatus(authentication.getName(), id, updateDto);
        return ResponseEntity.ok(updatedOrder);
    }
}