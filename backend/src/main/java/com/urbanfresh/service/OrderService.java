package com.urbanfresh.service;

import java.util.List;

import org.springframework.data.domain.Page;

import com.urbanfresh.dto.request.OrderStatusUpdateRequest;
import com.urbanfresh.dto.request.PlaceOrderRequest;
import com.urbanfresh.dto.response.AdminOrderResponse;
import com.urbanfresh.dto.response.AdminOrderReviewResponse;
import com.urbanfresh.dto.response.DeliveryAssignedOrderResponse;
import com.urbanfresh.dto.response.DeliveryOrderDetailsResponse;
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

    /**
     * Assigns an active delivery person to a READY order and transitions
     * the status to OUT_FOR_DELIVERY.
     *
     * @param orderId          ID of the order to assign
     * @param deliveryPersonId ID of the active DELIVERY role user
     * @param adminEmail       authenticated admin email used for auditing
     * @return updated admin-facing order summary with delivery person info
     */
    AdminOrderResponse assignDeliveryPersonnel(Long orderId, Long deliveryPersonId, String adminEmail);

    /**
     * Returns a paginated list of orders assigned to the authenticated delivery user.
     *
     * @param deliveryEmail email extracted from the JWT principal
     * @param page zero-based page index
     * @param size number of records per page
     * @return page of delivery dashboard summary rows
     */
    Page<DeliveryAssignedOrderResponse> getAssignedOrdersForDelivery(String deliveryEmail, int page, int size);

    /**
     * Returns delivery details for an order assigned to the authenticated delivery user.
     * Denies access when the order is not assigned to that delivery person.
     *
     * @param orderId order ID requested by delivery personnel
     * @param deliveryEmail email extracted from the JWT principal
     * @return delivery-focused order details (address, items, and current status)
     */
    DeliveryOrderDetailsResponse getAssignedOrderDetailsForDelivery(Long orderId, String deliveryEmail);

    /**
     * Updates status for an order assigned to the authenticated delivery user.
     * Delivery transitions are restricted to OUT_FOR_DELIVERY -> DELIVERED/RETURNED.
     *
     * @param orderId order ID assigned to the authenticated delivery user
     * @param request validated status update payload
     * @param deliveryEmail email extracted from JWT principal
     * @return updated delivery-focused order details
     */
    DeliveryOrderDetailsResponse updateAssignedOrderStatusForDelivery(
            Long orderId,
            OrderStatusUpdateRequest request,
            String deliveryEmail
    );

    /**
     * Finds all PENDING orders older than 24 hours and cancels them automatically,
     * restoring allocated stock back to the respective product batches.
     * Called by the scheduler to clean up abandoned payment sessions.
     */
    void cancelStalePendingOrders();
}
