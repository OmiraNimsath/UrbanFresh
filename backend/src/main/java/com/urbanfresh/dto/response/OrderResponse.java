package com.urbanfresh.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Full order response returned after placing or retrieving an order.
 * Includes the order header and all associated line items.
 */
@Getter
@Builder
public class OrderResponse {

    private Long orderId;
    private String status;
    private String paymentStatus;
    private String deliveryAddress;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;
}
