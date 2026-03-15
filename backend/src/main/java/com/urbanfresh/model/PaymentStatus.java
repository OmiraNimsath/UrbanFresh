package com.urbanfresh.model;

/**
 * Domain Layer – Enum representing payment lifecycle states.
 * Payment status must be updated only by payment-specific workflows.
 */
public enum PaymentStatus {
    PENDING,
    PAID,
    FAILED
}