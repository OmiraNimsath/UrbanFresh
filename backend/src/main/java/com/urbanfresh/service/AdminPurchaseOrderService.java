package com.urbanfresh.service;

import java.util.List;
import com.urbanfresh.dto.request.CreatePurchaseOrderRequest;
import com.urbanfresh.dto.response.PurchaseOrderDto;

/**
 * Service Layer - Manages admin-facing purchase order creation and tracking.
 */
public interface AdminPurchaseOrderService {

    /**
     * Create a new purchase order for a specific brand's products.
     * @param request the purchase order details.
     * @return the created purchase order DTO.
     */
    PurchaseOrderDto createPurchaseOrder(CreatePurchaseOrderRequest request);

    /**
     * Retrieve all purchase orders globally for admins.
     * @return list of all purchase orders.
     */
    List<PurchaseOrderDto> getAllPurchaseOrders();

    /**
     * Confirm a purchase order has been received, updating inventory stock.
     * @param orderId the ID of the purchase order.
     * @param adminUsername the username of the admin performing the action.
     * @return updated purchase order DTO.
     */
    PurchaseOrderDto confirmDeliveryAndStock(Long orderId, String adminUsername);
}