package com.urbanfresh.exception;

/**
 * Exception Layer – Thrown when a Stripe API call fails or returns an unexpected result.
 * Mapped to HTTP 502 Bad Gateway by GlobalExceptionHandler, as the failure originates
 * from an upstream payment processor.
 */
public class PaymentException extends RuntimeException {

    public PaymentException(String message) {
        super(message);
    }

    public PaymentException(String message, Throwable cause) {
        super(message, cause);
    }
}
