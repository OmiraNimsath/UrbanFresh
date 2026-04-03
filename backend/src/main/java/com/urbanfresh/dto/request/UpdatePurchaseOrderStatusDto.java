package com.urbanfresh.dto.request;

import com.urbanfresh.model.PurchaseOrderStatus;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO Layer - Request payload for updating the status of a purchase order by the supplier.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePurchaseOrderStatusDto {

    @NotNull(message = "Purchase order status is required")
    private PurchaseOrderStatus status;

    private String estimatedDeliveryTimeline;
}