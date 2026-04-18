package com.urbanfresh.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Request body for POST /api/orders (place order).
 * Contains the delivery address, the list of items, and optional loyalty points to redeem.
 */
@Getter
@Setter
@NoArgsConstructor
public class PlaceOrderRequest {

    /** Delivery address for this order — required at checkout time. */
    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    /** At least one item must be present to constitute a valid order. */
    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    /**
     * Number of loyalty points the customer wants to apply as a discount.
     * Omitting this field (or passing 0) means no redemption is requested.
     * Conversion: 1 point = Rs. 5 discount.
     */
    @Min(value = 0, message = "Points to redeem cannot be negative")
    private int pointsToRedeem = 0;
}
