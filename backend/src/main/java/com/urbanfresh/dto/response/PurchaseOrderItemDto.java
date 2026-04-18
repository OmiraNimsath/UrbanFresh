package com.urbanfresh.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO Layer - Response representing an item within a purchase order.
 * Includes batch metadata fields so admins can see batch details per line item.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderItemDto {

    private Long id;
    private Long productId;
    private String productName;
    private int quantity;
    private BigDecimal unitPrice;

    /** Supplier-assigned batch/lot number; null if not yet provided. */
    private String batchNumber;

    /** Manufacturing date declared by the supplier. */
    private LocalDate manufacturingDate;

    /** Expiry date declared by the supplier for this shipment. */
    private LocalDate supplierExpiryDate;
}