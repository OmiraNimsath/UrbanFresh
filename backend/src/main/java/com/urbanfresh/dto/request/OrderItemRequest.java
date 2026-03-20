package com.urbanfresh.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Represents a single line item in a place-order request.
 * Contains the product ID and the quantity the customer wants to purchase.
 */
@Getter
@Setter
@NoArgsConstructor
public class OrderItemRequest {

    /** ID of the product to order. */
    @NotNull(message = "Product ID is required")
    private Long productId;

    /** Must be at least 1 — ordering zero units is not meaningful. */
    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;
}
