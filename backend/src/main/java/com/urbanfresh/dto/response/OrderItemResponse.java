package com.urbanfresh.dto.response;

import java.math.BigDecimal;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Represents a single line item in an order response.
 * Uses snapshotted values (productName, unitPrice) so the response
 * reflects what was purchased, not the current product state.
 * Includes batchAllocations for audit trail — which batches supplied this item.
 */
@Getter
@Builder
public class OrderItemResponse {

    private Long productId;
    private String productName;
    private BigDecimal unitPrice;
    private Integer productDiscountPercentage;
    private int quantity;
    private BigDecimal lineTotal;

    /**
     * Batch allocations for this line item (FIFO breakdown).
     * Empty for legacy orders placed before batch tracking was introduced.
     */
    private List<BatchAllocationDto> batchAllocations;
}
