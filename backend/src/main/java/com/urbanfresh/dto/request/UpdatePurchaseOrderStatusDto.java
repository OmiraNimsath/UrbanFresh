package com.urbanfresh.dto.request;

import java.time.LocalDate;
import java.util.List;

import com.urbanfresh.model.PurchaseOrderStatus;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO Layer - Request payload for updating the status of a purchase order by the supplier.
 * When status is DELIVERED, the supplier may also supply per-item batch metadata.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePurchaseOrderStatusDto {

    @NotNull(message = "Purchase order status is required")
    private PurchaseOrderStatus status;

    private String estimatedDeliveryTimeline;
    private String rejectionReason;

    /** Per-item batch metadata; only meaningful when status == DELIVERED. */
    private List<ItemBatchData> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemBatchData {
        /** The PurchaseOrderItem ID this data applies to. */
        private Long itemId;
        private String batchNumber;
        private LocalDate manufacturingDate;
        private LocalDate supplierExpiryDate;
    }
}