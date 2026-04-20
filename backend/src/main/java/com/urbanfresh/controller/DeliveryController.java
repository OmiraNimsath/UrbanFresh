package com.urbanfresh.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.urbanfresh.dto.request.OrderStatusUpdateRequest;
import com.urbanfresh.dto.response.DeliveryAssignedOrderResponse;
import com.urbanfresh.dto.response.DeliveryOrderDetailsResponse;
import com.urbanfresh.dto.response.DeliveryProfileSummaryResponse;
import com.urbanfresh.service.OrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller Layer – Delivery-only endpoints for assigned order operations.
 */
@RestController
@RequestMapping("/api/delivery")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DELIVERY')")
public class DeliveryController {

    private final OrderService orderService;

        /**
         * Returns delivery profile summary metrics for the authenticated delivery person.
         *
         * @param authentication authenticated delivery principal
         * @return delivery profile summary counters
         */
        @GetMapping("/profile/summary")
        public ResponseEntity<DeliveryProfileSummaryResponse> getDeliveryProfileSummary(Authentication authentication) {
                String deliveryEmail = authentication.getName();
                DeliveryProfileSummaryResponse response = orderService.getDeliveryProfileSummary(deliveryEmail);

                return ResponseEntity.ok()
                                .cacheControl(CacheControl.noStore())
                                .body(response);
        }

    /**
     * Returns paginated orders assigned to the authenticated delivery person.
     *
     * @param authentication authenticated delivery principal
     * @param page zero-based page index (default 0)
     * @param size items per page (default 20)
     * @return paginated delivery dashboard rows
     */
    @GetMapping("/orders")
    public ResponseEntity<Page<DeliveryAssignedOrderResponse>> getAssignedOrders(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String deliveryEmail = authentication.getName();
        Page<DeliveryAssignedOrderResponse> response =
                orderService.getAssignedOrdersForDelivery(deliveryEmail, page, size);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    /**
     * Returns paginated READY orders that are not yet assigned to any delivery person.
     *
     * @param page zero-based page index (default 0)
     * @param size items per page (default 20)
     * @return paginated available order cards for acceptance
     */
    @GetMapping("/orders/available")
    public ResponseEntity<Page<DeliveryAssignedOrderResponse>> getAvailableOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<DeliveryAssignedOrderResponse> response = orderService.getAvailableOrdersForDelivery(page, size);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    /**
     * Returns order delivery details for the authenticated delivery person.
     * Access is allowed only when the order is assigned to that user.
     *
     * @param orderId order ID requested from the route path
     * @param authentication authenticated delivery principal
     * @return delivery details payload with address, items, and current status
     */
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<DeliveryOrderDetailsResponse> getAssignedOrderDetails(
            @PathVariable Long orderId,
            Authentication authentication
    ) {
        String deliveryEmail = authentication.getName();
        DeliveryOrderDetailsResponse response =
                orderService.getAssignedOrderDetailsForDelivery(orderId, deliveryEmail);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    /**
     * Updates status for an order assigned to the authenticated delivery person.
     * Allowed transitions: OUT_FOR_DELIVERY -> DELIVERED or RETURNED.
     *
     * @param orderId order ID requested from the route path
     * @param request validated delivery status update payload
     * @param authentication authenticated delivery principal
     * @return updated delivery details payload with new status
     */
    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<DeliveryOrderDetailsResponse> updateAssignedOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody OrderStatusUpdateRequest request,
            Authentication authentication
    ) {
        String deliveryEmail = authentication.getName();
        DeliveryOrderDetailsResponse response =
                orderService.updateAssignedOrderStatusForDelivery(orderId, request, deliveryEmail);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

        /**
         * Accepts a READY unassigned order for the authenticated delivery person.
         * Transitions status to OUT_FOR_DELIVERY and assigns the order.
         *
         * @param orderId order ID requested from the route path
         * @param authentication authenticated delivery principal
         * @return updated delivery dashboard summary row
         */
        @PatchMapping("/orders/{orderId}/accept")
        public ResponseEntity<DeliveryAssignedOrderResponse> acceptOrder(
                        @PathVariable Long orderId,
                        Authentication authentication
        ) {
                String deliveryEmail = authentication.getName();
                DeliveryAssignedOrderResponse response = orderService.acceptOrderForDelivery(orderId, deliveryEmail);

                return ResponseEntity.ok()
                                .cacheControl(CacheControl.noStore())
                                .body(response);
        }
}
