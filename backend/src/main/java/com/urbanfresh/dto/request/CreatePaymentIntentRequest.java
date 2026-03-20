package com.urbanfresh.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * DTO Layer – Request body for creating a Stripe PaymentIntent.
 * The client sends the orderId; the backend fetches the amount from the persisted order
 * to prevent price manipulation from the client side.
 */
@Getter
@NoArgsConstructor
public class CreatePaymentIntentRequest {

    /**
     * ID of the order to pay for.
     * The authenticated customer must own this order.
     */
    @NotNull(message = "orderId is required")
    @Positive(message = "orderId must be a positive number")
    private Long orderId;
}
