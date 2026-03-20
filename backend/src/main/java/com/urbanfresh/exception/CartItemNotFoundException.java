package com.urbanfresh.exception;

/**
 * Exception Layer – Thrown when a cart item cannot be found, or when the requesting
 * customer does not own the targeted cart item.
 * Mapped to HTTP 404 Not Found by GlobalExceptionHandler.
 */
public class CartItemNotFoundException extends RuntimeException {

    /**
     * @param cartItemId the cart item ID that was not found or not accessible
     */
    public CartItemNotFoundException(Long cartItemId) {
        super("Cart item not found with id: " + cartItemId);
    }
}
