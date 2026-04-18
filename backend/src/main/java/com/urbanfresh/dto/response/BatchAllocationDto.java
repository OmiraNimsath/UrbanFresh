package com.urbanfresh.dto.response;

import java.time.LocalDate;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Represents a single batch-level allocation for an order line item.
 * Shown in order details so customers and admins can trace which batch supplied each item.
 */
@Getter
@Builder
public class BatchAllocationDto {

    /** Supplier-assigned batch/lot number for traceability. */
    private String batchNumber;

    /** Expiry date of the allocated batch. */
    private LocalDate expiryDate;

    /** Number of units drawn from this batch for the parent order item. */
    private int allocatedQuantity;
}
