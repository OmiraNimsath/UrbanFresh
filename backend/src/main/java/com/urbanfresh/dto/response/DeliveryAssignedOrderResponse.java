package com.urbanfresh.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Delivery dashboard summary row for assigned orders.
 * Contains compact card fields and full address for details navigation.
 */
@Getter
@Builder
public class DeliveryAssignedOrderResponse {

    private Long orderId;
    private String customerName;
    private String customerPhone;
    private String shortDeliveryAddress;
    private String fullDeliveryAddress;
    private String status;
    private Integer itemCount;
    private String itemsSummary;
    private java.math.BigDecimal totalAmount;
    /** Discount applied via loyalty point redemption. Zero when no points were used. */
    private java.math.BigDecimal discountAmount;
    /** Number of loyalty points redeemed on this order. Zero when no points were used. */
    private int pointsRedeemed;
    private String paymentStatus;
    private String paymentMethod;
    private LocalDateTime createdAt;
    private LocalDateTime finalStatusAt;
}
