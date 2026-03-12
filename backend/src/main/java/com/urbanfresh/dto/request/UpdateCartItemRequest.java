package com.urbanfresh.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Request body for PUT /api/cart/items/{cartItemId} (update item quantity).
 */
@Getter
@Setter
@NoArgsConstructor
public class UpdateCartItemRequest {

    /** New quantity for the cart item; must be at least 1. */
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;
}
