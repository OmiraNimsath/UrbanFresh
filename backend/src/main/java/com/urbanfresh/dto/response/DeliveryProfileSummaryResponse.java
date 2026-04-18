package com.urbanfresh.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Delivery profile summary metrics for the authenticated delivery user.
 */
@Getter
@Builder
public class DeliveryProfileSummaryResponse {

    private Long assignedOrderCount;
    private Long outForDeliveryCount;
    private Long deliveredCount;
    private Long returnedCount;
    private Long completedOrderCount;
}