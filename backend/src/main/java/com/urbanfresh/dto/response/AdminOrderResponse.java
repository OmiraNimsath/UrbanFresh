package com.urbanfresh.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Admin order table response.
 * Provides operational order information for fulfillment and payment monitoring.
 */
@Getter
@Builder
public class AdminOrderResponse {

    private Long orderId;
    private String customerName;
    private String orderStatus;
    private String paymentStatus;
    private BigDecimal totalAmount;
    private LocalDateTime orderDate;

    /** ID of the delivery person assigned to this order; null if not yet assigned. */
    private Long deliveryPersonId;

    /** Name of the delivery person assigned to this order; null if not yet assigned. */
    private String deliveryPersonName;
}
