package com.urbanfresh.service;

import java.time.LocalDate;
import java.util.Optional;

import com.urbanfresh.model.OrderItem;
import com.urbanfresh.model.ProductBatch;

/**
 * Service Layer – Contract for product batch lifecycle management.
 * Covers batch creation (on PO confirmation), FIFO stock allocation (on order placement),
 * and aggregate queries used by the product API.
 */
public interface ProductBatchService {

    /**
     * Creates a new ProductBatch from a confirmed PurchaseOrderItem.
     * Also increments the product's legacy stockQuantity to keep existing stock-validation
     * logic working during the transition period.
     *
     * @param productId           ID of the product this batch belongs to
     * @param batchNumber         supplier-provided batch identifier
     * @param manufacturingDate   manufacturing date (may be null)
     * @param expiryDate          expiry date of this batch
     * @param quantity            number of units received
     * @param purchaseOrderItemId FK for audit trail
     * @return the persisted ProductBatch
     */
    ProductBatch createBatch(Long productId, String batchNumber, LocalDate manufacturingDate,
                             LocalDate expiryDate, int quantity, Long purchaseOrderItemId);

    /**
     * Allocates stock from available batches using FIFO (earliest expiry first).
     * Deducts availableQuantity from each batch and persists OrderItemBatchAllocation records.
     * Throws InsufficientStockException if total available < requested quantity.
     *
     * @param orderItem the persisted OrderItem to link allocations to
     * @param quantity  total units to allocate
     */
    void allocateBatchesFifo(OrderItem orderItem, int quantity);

    /**
     * Returns the total available units across all allocatable batches for a product.
     *
     * @param productId product ID
     * @return sum of availableQuantity across ACTIVE and NEAR_EXPIRY batches
     */
    int getTotalAvailableQuantity(Long productId);

    /**
     * Returns the earliest expiry date across allocatable batches for a product.
     * Returns empty if no tracked batches exist (product predates batch tracking).
     *
     * @param productId product ID
     * @return optional earliest expiry date
     */
    Optional<LocalDate> getEarliestExpiryDate(Long productId);
}
