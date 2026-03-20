package com.urbanfresh.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Request payload for updating a product's inventory.
 * Carries the new stock quantity and reorder threshold submitted by an admin.
 * Layer: DTO (Request)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryUpdateRequest {

    /**
     * Current stock quantity for the product.
     * Must be zero or a positive integer.
     */
    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity must be 0 or greater")
    private Integer quantity;

    /**
     * Minimum stock level below which a restock alert is raised.
     * Must be zero or a positive integer.
     */
    @NotNull(message = "Reorder threshold is required")
    @Min(value = 0, message = "Reorder threshold must be 0 or greater")
    private Integer reorderThreshold;
}
