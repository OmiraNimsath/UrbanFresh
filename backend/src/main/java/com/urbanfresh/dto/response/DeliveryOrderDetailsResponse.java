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
    private String deliveryAddress;
    private List<OrderItemResponse> items;
}
