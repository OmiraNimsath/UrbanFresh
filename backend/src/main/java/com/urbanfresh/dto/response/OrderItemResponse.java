package com.urbanfresh.dto.response;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Represents a single line item in an order response.
 * Uses snapshotted values (productName, unitPrice) so the response
 * reflects what was purchased, not the current product state.
 */
@Getter
@Builder
public class OrderItemResponse {

    private Long productId;
    private String productName;
    private BigDecimal unitPrice;
    private int quantity;
    private BigDecimal lineTotal;
}
