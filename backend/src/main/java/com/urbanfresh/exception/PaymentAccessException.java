package com.urbanfresh.exception;

/**
 * Exception Layer – Thrown when a customer tries to pay for an order that does not belong to them.
 * Mapped to HTTP 403 Forbidden by GlobalExceptionHandler.
 */
public class PaymentAccessException extends RuntimeException {

    public PaymentAccessException(String message) {
        super(message);
    }
}
