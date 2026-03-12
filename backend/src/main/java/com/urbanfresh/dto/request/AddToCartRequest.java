package com.urbanfresh.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Request body for POST /api/cart/items (add product to cart).
 * quantity defaults to 1 when not provided by the client.
 */
@Getter
@Setter
@NoArgsConstructor
public class AddToCartRequest {

    /** ID of the product to add. */
    @NotNull(message = "Product ID is required")
    private Long productId;

    /** How many units to add; must be at least 1. */
    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity = 1;
}
