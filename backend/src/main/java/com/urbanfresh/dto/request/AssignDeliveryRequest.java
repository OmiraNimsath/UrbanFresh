package com.urbanfresh.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * DTO Layer – Request payload for assigning delivery personnel to an order.
 * Admin submits the ID of the active delivery person to assign.
 */
@Getter
@NoArgsConstructor
public class AssignDeliveryRequest {

    /** ID of the active delivery personnel user to assign to the order. */
    @NotNull(message = "Delivery person ID is required.")
    private Long deliveryPersonId;
}
