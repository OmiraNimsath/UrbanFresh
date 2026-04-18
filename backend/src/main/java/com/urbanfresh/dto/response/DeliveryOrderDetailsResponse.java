package com.urbanfresh.dto.response;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Delivery-facing order details payload.
 * Contains only the fields needed to complete a delivery.
 */
@Getter
@Builder
public class DeliveryOrderDetailsResponse {

    private Long orderId;
    private String status;
    private String customerName;
    private String customerPhone;
    private String deliveryAddress;
    private java.math.BigDecimal totalAmount;
    /** Discount applied via loyalty point redemption. Zero when no points were used. */
    private java.math.BigDecimal discountAmount;
    /** Number of loyalty points redeemed on this order. Zero when no points were used. */
    private int pointsRedeemed;
    private String paymentStatus;
    private String paymentMethod;
    private List<OrderItemResponse> items;
}
