package com.urbanfresh.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Response payload representing a single product's inventory entry.
 * Returned by the admin inventory endpoints and includes audit metadata.
 * Layer: DTO (Response)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryResponse {

    /** ID of the associated product. */
    private Long productId;

    /** Human-readable product name. */
    private String productName;

    /** Product category for grouping in the admin table. */
    private String category;

    /** Current warehouse quantity. */
    private int quantity;

    /** Minimum quantity before a restock alert is triggered. */
    private int reorderThreshold;

    private Long brandId;

    /**
     * True when quantity is at or below the reorderThreshold.
     * Derived at mapping time — not stored in the database.
     */
    private boolean lowStock;

    /** Timestamp of the last inventory update (managed by @PreUpdate on Product). */
    private LocalDateTime updatedAt;

    /** Email of the admin who last modified inventory fields. Null if never updated via inventory API. */
    private String updatedBy;
}
