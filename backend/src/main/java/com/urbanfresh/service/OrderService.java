package com.urbanfresh.service;

import java.util.List;

import org.springframework.data.domain.Page;

import com.urbanfresh.dto.request.OrderStatusUpdateRequest;
import com.urbanfresh.dto.request.PlaceOrderRequest;
import com.urbanfresh.dto.response.AdminOrderResponse;
import com.urbanfresh.dto.response.AdminOrderReviewResponse;
import com.urbanfresh.dto.response.OrderResponse;

/**
 * Service Layer – Contract for order placement and retrieval operations.
 */
public interface OrderService {

    /**
     * Place a new order for the authenticated customer.
     * Validates stock, deducts inventory, persists the order, and returns the result.
     *
     * @param request       validated order payload (items + delivery address)
     * @param customerEmail email extracted from the JWT — used to identify the customer
     * @return OrderResponse containing the new order ID, status, and line items
     */
    OrderResponse placeOrder(PlaceOrderRequest request, String customerEmail);

    /**
     * Return the authenticated customer's order history, newest first.
     *
     * @param customerEmail email extracted from the JWT
     * @return list of OrderResponse; empty list when no orders exist
     */
    List<OrderResponse> getMyOrders(String customerEmail);

    /**
     * Returns a single order by ID for the authenticated customer.
     * Ownership is enforced; orders from other users are rejected.
     *
     * @param orderId order ID requested by the customer
     * @param customerEmail email extracted from the JWT
     * @return OrderResponse when found and owned by the authenticated customer
     */
    OrderResponse getMyOrderById(Long orderId, String customerEmail);

    /**
     * Returns a paginated list of all orders for admin order management.
     *
     * @param page zero-based page index
     * @param size number of records per page
     * @return page of admin-facing order summaries
     */
    Page<AdminOrderResponse> getAllOrdersForAdmin(int page, int size);

    /**
     * Returns full order details for admin review screens.
     *
     * @param orderId ID of the order to inspect
     * @return detailed admin order review payload
     */
    AdminOrderReviewResponse getOrderReviewForAdmin(Long orderId);

    /**
     * Updates the status of an existing order.
     *
     * @param orderId  ID of the order to update
     * @param request  validated status update payload
     * @param adminEmail authenticated admin email used for auditing
     * @return updated admin-facing order summary
     */
    AdminOrderResponse updateOrderStatus(Long orderId, OrderStatusUpdateRequest request, String adminEmail);
}
