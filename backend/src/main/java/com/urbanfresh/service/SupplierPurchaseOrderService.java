package com.urbanfresh.service;

import java.util.List;

import com.urbanfresh.dto.request.UpdatePurchaseOrderStatusDto;
import com.urbanfresh.dto.response.PurchaseOrderDto;

/**
 * Service Layer - Manages supplier-facing purchase order operations.
 */
public interface SupplierPurchaseOrderService {

    /**
     * Retrieve all purchase orders mapped to the brands of a specific supplier.
     * 
     * @param supplierId the ID of the authenticated supplier user.
     * @return a list of DTOs representing the scoped purchase orders.
     */
    List<PurchaseOrderDto> getPurchaseOrdersForSupplier(Long supplierId);

    /**
     * Update the shipment status and estimated delivery timeline of a purchase order.
     * Enforces brand-scoping (403 Forbidden if accessed incorrectly).
     * 
     * @param supplierId the ID of the authenticated supplier user.
     * @param orderId the ID of the purchase order.
     * @param updateDto the status and delivery timeline updates.
     * @return the updated purchase order DTO.
     */
    PurchaseOrderDto updateShipmentStatus(Long supplierId, Long orderId, UpdatePurchaseOrderStatusDto updateDto);
}