package com.urbanfresh.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urbanfresh.dto.request.PlaceOrderRequest;
import com.urbanfresh.dto.response.OrderResponse;
import com.urbanfresh.service.OrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller Layer – Exposes the order placement endpoint for authenticated customers.
 * Route: POST /api/orders
 * Access: ROLE_CUSTOMER only.
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * Places a new order for the authenticated customer.
     * Validates the request body, delegates stock validation and deduction to
     * OrderService, and returns the created order with HTTP 201.
     *
     * @param request        validated order payload (delivery address + items)
     * @param authentication Spring Security principal — used to extract the caller's email
     * @return 201 Created with the OrderResponse body
     */
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponse> placeOrder(
            @Valid @RequestBody PlaceOrderRequest request,
            Authentication authentication) {

        String customerEmail = authentication.getName();
        OrderResponse response = orderService.placeOrder(request, customerEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
