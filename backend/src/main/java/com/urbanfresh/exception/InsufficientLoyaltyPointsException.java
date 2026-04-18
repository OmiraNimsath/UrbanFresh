package com.urbanfresh.exception;

/**
 * Exception Layer – Thrown when a customer attempts to redeem more loyalty points
 * than their available balance, or when the resulting discount would exceed the
 * order total.
 */
public class InsufficientLoyaltyPointsException extends RuntimeException {

    public InsufficientLoyaltyPointsException(String message) {
        super(message);
    }
}
