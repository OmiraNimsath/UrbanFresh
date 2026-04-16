package com.urbanfresh.dto.request;

import java.time.LocalDate;
import java.util.List;

import lombok.Data;

/**
 * Request body for confirming a purchase order delivery.
 * Carries per-item batch metadata so the admin can supply batch details
 * (batch number, expiry date, manufacturing date) at confirmation time.
 */
@Data
public class ConfirmDeliveryRequest {

    /** Per-item batch overrides. If null or empty, existing PO item data is used. */
    private List<ItemBatchOverride> items;

    @Data
    public static class ItemBatchOverride {
        /** The PurchaseOrderItem ID this override applies to. */
        private Long itemId;

        /** Supplier/admin-assigned batch or lot number. */
        private String batchNumber;

        /** Manufacturing date for the batch. */
        private LocalDate manufacturingDate;

        /** Expiry date for the batch — required to enable batch tracking. */
        private LocalDate supplierExpiryDate;
    }
}
