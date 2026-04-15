package com.urbanfresh.service.impl;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.exception.InsufficientStockException;
import com.urbanfresh.exception.ProductNotFoundException;
import com.urbanfresh.model.BatchStatus;
import com.urbanfresh.model.OrderItem;
import com.urbanfresh.model.OrderItemBatchAllocation;
import com.urbanfresh.model.Product;
import com.urbanfresh.model.ProductBatch;
import com.urbanfresh.repository.OrderItemBatchAllocationRepository;
import com.urbanfresh.repository.ProductBatchRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.service.ProductBatchService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service Layer – Implements ProductBatchService.
 * Handles batch creation on PO confirmation and FIFO batch allocation on order placement.
 * Keeps batch mutation logic isolated from OrderService and PurchaseOrderService.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductBatchServiceImpl implements ProductBatchService {

    private final ProductBatchRepository productBatchRepository;
    private final OrderItemBatchAllocationRepository allocationRepository;
    private final ProductRepository productRepository;

    /**
     * Creates a ProductBatch for the given product using supplier-provided batch metadata.
     * Increments legacy stockQuantity on the Product for backward compatibility with
     * existing stock-validation logic in OrderServiceImpl.
     */
    @Override
    @Transactional
    public ProductBatch createBatch(Long productId, String batchNumber, LocalDate manufacturingDate,
                                    LocalDate expiryDate, int quantity, Long purchaseOrderItemId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        ProductBatch batch = ProductBatch.builder()
                .product(product)
                .batchNumber(batchNumber)
                .manufacturingDate(manufacturingDate)
                .expiryDate(expiryDate)
                .receivedQuantity(quantity)
                .availableQuantity(quantity)
                .status(BatchStatus.ACTIVE)
                .purchaseOrderItemId(purchaseOrderItemId)
                .build();

        ProductBatch saved = productBatchRepository.save(batch);

        // Keep legacy stockQuantity in sync so existing pessimistic-lock / validation
        // logic in OrderServiceImpl continues to work without modification
        product.setStockQuantity(product.getStockQuantity() + quantity);
        productRepository.save(product);

        log.info("Created ProductBatch ID {} (batchNumber: {}, qty: {}) for product ID {}",
                saved.getId(), batchNumber, quantity, productId);
        return saved;
    }

    /**
     * Allocates units from available batches using FIFO (oldest expiry date first).
     * Iterates batches sorted by expiryDate ASC, deducting from each until satisfied.
     * Marks a batch EXPIRED when its availableQuantity reaches zero.
     *
     * @throws InsufficientStockException if total available quantity < requested (should not
     *         occur if OrderService stock validation ran first, but guarded for safety)
     */
    @Override
    @Transactional
    public void allocateBatchesFifo(OrderItem orderItem, int quantity) {
        Long productId = orderItem.getProduct().getId();
        List<ProductBatch> batches = productBatchRepository.findAllocatableBatchesByProductId(productId);

        int remaining = quantity;

        for (ProductBatch batch : batches) {
            if (remaining <= 0) break;

            int fromThisBatch = Math.min(batch.getAvailableQuantity(), remaining);
            batch.setAvailableQuantity(batch.getAvailableQuantity() - fromThisBatch);

            // Fully depleted batches are no longer allocatable — mark them expired
            if (batch.getAvailableQuantity() == 0) {
                batch.setStatus(BatchStatus.EXPIRED);
            }

            productBatchRepository.save(batch);

            allocationRepository.save(OrderItemBatchAllocation.builder()
                    .orderItem(orderItem)
                    .batch(batch)
                    .allocatedQuantity(fromThisBatch)
                    .build());

            log.debug("Allocated {} units from batch ID {} (expiry: {}) for order item ID {}",
                    fromThisBatch, batch.getId(), batch.getExpiryDate(), orderItem.getId());

            remaining -= fromThisBatch;
        }

        if (remaining > 0) {
            // Guard: stock validation in OrderService should prevent reaching here
            throw new InsufficientStockException(
                    String.format("Batch stock exhausted for '%s': unable to allocate %d remaining units via FIFO",
                            orderItem.getProductName(), remaining));
        }
    }

    /** Returns total allocatable quantity across ACTIVE and NEAR_EXPIRY batches. */
    @Override
    public int getTotalAvailableQuantity(Long productId) {
        return productBatchRepository.sumAvailableQuantityByProductId(productId);
    }

    /** Returns the earliest expiry date from allocatable batches; empty for legacy products. */
    @Override
    public Optional<LocalDate> getEarliestExpiryDate(Long productId) {
        return productBatchRepository.findEarliestExpiryDateByProductId(productId);
    }
}
