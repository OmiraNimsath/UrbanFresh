package com.urbanfresh.service;

import java.util.List;

import com.urbanfresh.dto.request.InventoryUpdateRequest;
import com.urbanfresh.dto.response.BatchResponse;
import com.urbanfresh.dto.response.InventoryResponse;

/**
 * Service Layer – Contract for admin inventory management operations.
 * Defines the lookup and update capabilities exposed through InventoryController.
 * Layer: Service
 */
public interface InventoryService {

    /**
     * Returns the full inventory list, one entry per product, sorted alphabetically by name.
     *
     * @return list of InventoryResponse representing all products' stock information
     */
    List<InventoryResponse> getAllInventory();

    /**
     * Updates the stock quantity and reorder threshold for the identified product.
     * Records the admin's email as an audit trail entry.
     *
     * @param productId  ID of the product whose inventory will be updated
     * @param request    validated payload containing new quantity and reorderThreshold
     * @param updatedBy  email of the authenticated admin performing the update
     * @return InventoryResponse reflecting the persisted state
     */
    InventoryResponse updateInventory(Long productId, InventoryUpdateRequest request, String updatedBy);

    /**
     * Returns all batches for a product ordered by expiry date ascending.
     * Allows admin to inspect batch composition and identify near-expiry batches.
     *
     * @param productId ID of the product whose batches to retrieve
     * @return list of BatchResponse ordered oldest-expiry-first
     */
    List<BatchResponse> getProductBatches(Long productId);
}
