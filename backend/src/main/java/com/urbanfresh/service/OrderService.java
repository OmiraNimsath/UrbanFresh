package com.urbanfresh.service;

import com.urbanfresh.dto.request.PlaceOrderRequest;
import com.urbanfresh.dto.response.OrderResponse;

/**
 * Service Layer – Contract for order placement and retrieval operations.
 */
public interface OrderService {

    /**
     * Place a new order for the authenticated customer.
     * Validates stock, deducts inventory, persists the order, and returns the result.
     *
     * @param request    validated order payload (items + delivery address)
     * @param customerEmail email extracted from the JWT — used to identify the customer
     * @return OrderResponse containing the new order ID, status, and line items
     */
    OrderResponse placeOrder(PlaceOrderRequest request, String customerEmail);
}
