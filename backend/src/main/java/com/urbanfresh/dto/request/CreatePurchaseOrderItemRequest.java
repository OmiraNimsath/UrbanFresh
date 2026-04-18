package com.urbanfresh.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for a line item within a new purchase order.
 * Optionally carries batch metadata (batchNumber, dates) that the admin can
 * fill in once the supplier confirms shipment details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePurchaseOrderItemRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;

    /** Optional supplier-assigned batch/lot number. */
    private String batchNumber;

    /** Optional manufacturing date declared by the supplier. */
    private LocalDate manufacturingDate;

    /** Optional expiry date declared by the supplier for this shipment. */
    private LocalDate supplierExpiryDate;
}