package com.urbanfresh.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Request body for POST /api/orders (place order).
 * Contains the delivery address and the list of items being ordered.
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
}
