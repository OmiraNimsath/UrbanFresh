package com.urbanfresh.exception;

/**
 * Exception Layer – Thrown when an order cannot be found by ID.
 */
public class OrderNotFoundException extends RuntimeException {

    /**
     * Creates a new exception for a missing order.
     *
     * @param orderId missing order ID
     */
    public OrderNotFoundException(Long orderId) {
        super("Order not found with id: " + orderId);
    }
}
