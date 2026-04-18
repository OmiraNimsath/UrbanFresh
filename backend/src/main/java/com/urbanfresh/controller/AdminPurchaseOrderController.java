package com.urbanfresh.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urbanfresh.dto.request.ConfirmDeliveryRequest;
import com.urbanfresh.dto.request.CreatePurchaseOrderRequest;
import com.urbanfresh.dto.response.PurchaseOrderDto;
import com.urbanfresh.service.AdminPurchaseOrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller Layer - Exposes admin endpoints for creating and viewing all purchase orders.
 */
@RestController
@RequestMapping("/api/admin/purchase-orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPurchaseOrderController {

    private final AdminPurchaseOrderService adminPurchaseOrderService;

    /**
     * View all purchase orders in the system.
     */
    @GetMapping
    public ResponseEntity<List<PurchaseOrderDto>> getAllPurchaseOrders() {
        return ResponseEntity.ok(adminPurchaseOrderService.getAllPurchaseOrders());
    }

    /**
     * Create a new purchase order for a supplier's brand.
     */
    @PostMapping
    public ResponseEntity<PurchaseOrderDto> createPurchaseOrder(@Valid @RequestBody CreatePurchaseOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminPurchaseOrderService.createPurchaseOrder(request));
    }
    /**
     * Confirm a sent purchase order has been received. Updates inventory stock.
     * Accepts optional per-item batch metadata to enable batch tracking.
     */
    @PutMapping("/{id}/confirm")
    public ResponseEntity<PurchaseOrderDto> confirmDelivery(
            @PathVariable Long id,
            @RequestBody(required = false) ConfirmDeliveryRequest request,
            Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();  
        String username = userDetails.getUsername();
        return ResponseEntity.ok(adminPurchaseOrderService.confirmDeliveryAndStock(id, username, request));
    }}