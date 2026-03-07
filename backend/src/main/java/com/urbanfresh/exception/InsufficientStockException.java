package com.urbanfresh.exception;

/**
 * Exception Layer – Thrown when one or more items in an order cannot be
 * fulfilled due to insufficient stock. The message names the specific
 * product(s) so the client can display a meaningful error.
 */
public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(String message) {
        super(message);
    }
}
