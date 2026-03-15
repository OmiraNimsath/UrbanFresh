package com.urbanfresh.model;

/**
 * Domain Layer – Enum representing the lifecycle states of a customer order.
 * Global statuses are shared by Admin and Delivery workflows.
 */
public enum OrderStatus {
    PENDING,
    PROCESSING,
    READY,
    CANCELLED,
    OUT_FOR_DELIVERY,
    DELIVERED,
    RETURNED
}
