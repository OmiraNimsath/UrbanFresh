package com.urbanfresh.exception;

/**
 * Exception Layer – Thrown when an invalid order status transition is requested.
 */
public class InvalidOrderStatusTransitionException extends RuntimeException {

    /**
     * Creates a new invalid transition exception.
     *
     * @param message reason why the transition is not allowed
     */
    public InvalidOrderStatusTransitionException(String message) {
        super(message);
    }
}
