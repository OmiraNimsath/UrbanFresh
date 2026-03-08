package com.urbanfresh.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urbanfresh.dto.response.LoyaltyPointsResponse;
import com.urbanfresh.dto.response.OrderResponse;
import com.urbanfresh.service.LoyaltyService;
import com.urbanfresh.service.OrderService;

import lombok.RequiredArgsConstructor;

/**
 * Controller Layer – Exposes read-only customer dashboard endpoints.
 * Routes:
 *   GET /api/customer/orders  — authenticated customer's order history
 *   GET /api/customer/loyalty — authenticated customer's loyalty points summary
 * Access: ROLE_CUSTOMER only (enforced via @PreAuthorize on each method).
 */
@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final OrderService orderService;
    private final LoyaltyService loyaltyService;

    /**
     * Returns the order history for the authenticated customer, newest first.
     * Returns an empty list (HTTP 200) when no orders have been placed yet.
     *
     * @param authentication Spring Security principal — email extracted from JWT
     * @return 200 OK with list of OrderResponse (may be empty)
     */
    @GetMapping("/orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<OrderResponse>> getMyOrders(Authentication authentication) {
        String customerEmail = authentication.getName();
        List<OrderResponse> orders = orderService.getMyOrders(customerEmail);
        return ResponseEntity.ok(orders);
    }

    /**
     * Returns the loyalty points summary for the authenticated customer.
     * If the customer has never placed an order, returns a zero-balance summary.
     *
     * @param authentication Spring Security principal — email extracted from JWT
     * @return 200 OK with LoyaltyPointsResponse
     */
    @GetMapping("/loyalty")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<LoyaltyPointsResponse> getLoyaltyPoints(Authentication authentication) {
        String customerEmail = authentication.getName();
        LoyaltyPointsResponse loyalty = loyaltyService.getLoyaltyPoints(customerEmail);
        return ResponseEntity.ok(loyalty);
    }
}
