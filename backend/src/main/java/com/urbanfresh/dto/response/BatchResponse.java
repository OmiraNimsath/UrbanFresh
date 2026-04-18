package com.urbanfresh.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.urbanfresh.model.BatchStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * DTO Layer – Admin-facing response representing a single product batch.
 * Returned by GET /api/admin/inventory/{productId}/batches.
 * Exposes all batch fields including availability and status for admin inspection.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchResponse {

    private Long id;

    /** Supplier-assigned batch/lot number. */
    private String batchNumber;

    /** Manufacturing date as declared by the supplier. */
    private LocalDate manufacturingDate;

    /** Expiry date for this batch — the FIFO sort key. */
    private LocalDate expiryDate;

    /** Total units originally received in this shipment. */
    private int receivedQuantity;

    /** Units still available for allocation. */
    private int availableQuantity;

    /** Current lifecycle status of this batch. */
    private BatchStatus status;

    /** FK of the PurchaseOrderItem that generated this batch (for traceability). */
    private Long purchaseOrderItemId;

    private String notes;

    /** Timestamp when this batch was received and created in the system. */
    private LocalDateTime receivedAt;
}
