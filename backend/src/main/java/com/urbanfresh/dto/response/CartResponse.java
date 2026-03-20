package com.urbanfresh.dto.response;

import java.math.BigDecimal;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Full cart state returned after every cart mutation and on GET /api/cart.
 * Returning the complete cart on every write keeps the frontend in sync with a single response.
 */
@Getter
@Builder
public class CartResponse {

    private List<CartItemResponse> items;

    /** Sum of all line totals. Computed fresh on every response so it always reflects live prices. */
    private BigDecimal totalAmount;

    /** Total number of individual units across all items (sum of quantities, not distinct products). */
    private int itemCount;
}
