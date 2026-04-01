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
    private String shortDeliveryAddress;
    private String fullDeliveryAddress;
    private String status;
    private Integer itemCount;
    private String itemsSummary;
    private LocalDateTime createdAt;
}
