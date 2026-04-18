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
    /** Discount applied via loyalty point redemption (Rs. 5 per point). Zero when no points were used. */
    private BigDecimal discountAmount;
    /** Number of loyalty points redeemed on this order. Zero when no points were used. */
    private int pointsRedeemed;

    /** ID of the delivery person assigned to this order; null if not yet assigned. */
    private Long deliveryPersonId;

    /** Name of the delivery person assigned to this order; null if not yet assigned. */
    private String deliveryPersonName;
}
