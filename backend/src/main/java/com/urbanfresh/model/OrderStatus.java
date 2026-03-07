package com.urbanfresh.model;

/**
 * Domain Layer – Enum representing the lifecycle states of a customer order.
 * PENDING   → order created, awaiting payment confirmation.
 * CONFIRMED → payment verified, order passed to fulfilment.
 * CANCELLED → order rejected (e.g. insufficient stock, payment failure).
 */
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    CANCELLED
}
