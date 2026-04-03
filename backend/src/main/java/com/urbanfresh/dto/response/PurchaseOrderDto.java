package com.urbanfresh.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.urbanfresh.model.PurchaseOrderStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO Layer - Response representing a purchase order sent to a supplier.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderDto {

    private Long id;
    private Long brandId;
    private String brandName;
    private PurchaseOrderStatus status;
    private String estimatedDeliveryTimeline;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PurchaseOrderItemDto> items;
}