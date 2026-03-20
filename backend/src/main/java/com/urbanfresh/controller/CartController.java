package com.urbanfresh.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urbanfresh.dto.request.AddToCartRequest;
import com.urbanfresh.dto.request.UpdateCartItemRequest;
import com.urbanfresh.dto.response.CartResponse;
import com.urbanfresh.service.CartService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller Layer – Exposes cart management endpoints for authenticated customers.
 * Routes: /api/cart
 * Access: ROLE_CUSTOMER only (enforced at both URL level and method level).
 * Every mutating endpoint returns the full updated CartResponse so the
 * client never needs a separate GET after a write.
 */
@RestController
@RequestMapping("/api/cart")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    /**
     * Returns the current cart for the authenticated customer.
     * Returns an empty cart (no items, zero total) when no cart exists yet.
     *
     * @param authentication Spring Security principal — provides the caller's email
     * @return 200 OK with CartResponse
     */
    @GetMapping
    public ResponseEntity<CartResponse> getCart(Authentication authentication) {
        CartResponse response = cartService.getCart(authentication.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Adds a product to the cart, or increments its quantity if already present.
     *
     * @param request        validated payload containing productId and quantity
     * @param authentication Spring Security principal
     * @return 200 OK with the updated CartResponse
     */
    @PostMapping("/items")
    public ResponseEntity<CartResponse> addToCart(
            @Valid @RequestBody AddToCartRequest request,
            Authentication authentication) {

        CartResponse response = cartService.addToCart(authentication.getName(), request);
        return ResponseEntity.ok(response);
    }

    /**
     * Updates the quantity of a specific cart item.
     * Returns 404 if the item does not exist or does not belong to this customer.
     *
     * @param cartItemId     path variable identifying the cart item
     * @param request        validated payload with the new quantity
     * @param authentication Spring Security principal
     * @return 200 OK with the updated CartResponse
     */
    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponse> updateCartItem(
            @PathVariable Long cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request,
            Authentication authentication) {

        CartResponse response = cartService.updateCartItem(
                authentication.getName(), cartItemId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Removes a single item from the cart.
     * Returns 404 if the item does not exist or does not belong to this customer.
     *
     * @param cartItemId     path variable identifying the cart item to remove
     * @param authentication Spring Security principal
     * @return 200 OK with the updated CartResponse
     */
    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponse> removeCartItem(
            @PathVariable Long cartItemId,
            Authentication authentication) {

        CartResponse response = cartService.removeCartItem(
                authentication.getName(), cartItemId);
        return ResponseEntity.ok(response);
    }

    /**
     * Clears all items from the customer's cart.
     *
     * @param authentication Spring Security principal
     * @return 204 No Content
     */
    @DeleteMapping
    public ResponseEntity<Void> clearCart(Authentication authentication) {
        cartService.clearCart(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
