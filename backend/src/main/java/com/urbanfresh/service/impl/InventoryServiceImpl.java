package com.urbanfresh.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.request.InventoryUpdateRequest;
import com.urbanfresh.dto.response.BatchResponse;
import com.urbanfresh.dto.response.InventoryResponse;
import com.urbanfresh.exception.ProductNotFoundException;
import com.urbanfresh.model.BatchStatus;
import com.urbanfresh.model.Product;
import com.urbanfresh.model.ProductBatch;
import com.urbanfresh.repository.ProductBatchRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.service.InventoryService;

import lombok.RequiredArgsConstructor;

/**
 * Service Layer – Implements inventory lookup and stock-level update operations.
 * Delegates all persistence to ProductRepository and enforces audit recording
 * by storing the updating admin's email on each inventory change.
 * Layer: Service
 */
@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;

    /**
     * Retrieves all products sorted alphabetically and maps each to an InventoryResponse.
     * The lowStock flag is derived at mapping time: quantity &lt;= reorderThreshold.
     *
     * @return list of InventoryResponse for every product in the catalogue
     */
    @Override
    public List<InventoryResponse> getAllInventory() {
        return productRepository
                .findAll(Sort.by("name").ascending())
                .stream()
                .map(this::toInventoryResponse)
                .collect(Collectors.toList());
    }

    /**
     * Updates stockQuantity, reorderThreshold, and the audit field inventoryUpdatedBy
     * for the identified product, then persists and returns the updated inventory entry.
     *
     * @param productId  ID of the product to update
     * @param request    validated payload with new quantity and reorderThreshold
     * @param updatedBy  email of the admin performing the update (stored for audit)
     * @return InventoryResponse reflecting the saved state
     */
    @Override
    @Transactional
    public InventoryResponse updateInventory(Long productId, InventoryUpdateRequest request, String updatedBy) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        product.setStockQuantity(request.getQuantity());
        product.setReorderThreshold(request.getReorderThreshold());
        // Record the admin email so changes can be traced in the admin table.
        product.setInventoryUpdatedBy(updatedBy);

        // Sync active batch availableQuantity so that batch-aware display (toResponse)
        // reflects the manually corrected stock. Distribute new total across active
        // batches oldest-first, capping each at its original receivedQuantity.
        List<ProductBatch> activeBatches =
                productBatchRepository.findAllocatableBatchesByProductId(productId);
        int remaining = request.getQuantity();
        for (ProductBatch batch : activeBatches) {
            int newQty = Math.min(remaining, batch.getReceivedQuantity());
            batch.setAvailableQuantity(newQty);
            if (newQty == 0) {
                batch.setStatus(BatchStatus.EXPIRED);
            }
            productBatchRepository.save(batch);
            remaining = Math.max(0, remaining - newQty);
        }

        Product saved = productRepository.save(product);
        return toInventoryResponse(saved);
    }

    /**
     * Returns all batches for a product ordered by expiry date ascending.
     * Provides the admin with a full snapshot of batch composition per product.
     *
     * @param productId ID of the product
     * @return list of BatchResponse ordered oldest-expiry-first
     */
    @Override
    @Transactional(readOnly = true)
    public List<BatchResponse> getProductBatches(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ProductNotFoundException(productId);
        }
        return productBatchRepository
                .findByProductIdOrderByExpiryDateAsc(productId)
                .stream()
                .map(this::toBatchResponse)
                .collect(Collectors.toList());
    }

    /**
     * Sets a batch status to QUARANTINED so it is excluded from FIFO allocation.
     * Also decrements the product's legacy stockQuantity by the batch's remaining
     * available units, keeping the aggregate count consistent.
     *
     * @param productId ID of the owning product (cross-checked for integrity)
     * @param batchId   ID of the batch to quarantine
     * @return updated BatchResponse with QUARANTINED status
     */
    @Override
    @Transactional
    public BatchResponse quarantineBatch(Long productId, Long batchId) {
        ProductBatch batch = productBatchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Batch ID " + batchId + " not found."));

        // Verify the batch actually belongs to the specified product
        if (!batch.getProduct().getId().equals(productId)) {
            throw new IllegalArgumentException(
                    "Batch ID " + batchId + " does not belong to product ID " + productId + ".");
        }

        // Idempotent: already quarantined batches return as-is
        if (batch.getStatus() == BatchStatus.QUARANTINED) {
            return toBatchResponse(batch);
        }

        // Subtract the batch's remaining available units from legacy stockQuantity
        Product product = batch.getProduct();
        int toDeduct = batch.getAvailableQuantity();
        if (toDeduct > 0) {
            product.setStockQuantity(Math.max(0, product.getStockQuantity() - toDeduct));
            productRepository.save(product);
        }

        batch.setStatus(BatchStatus.QUARANTINED);
        batch.setAvailableQuantity(0);
        return toBatchResponse(productBatchRepository.save(batch));
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Maps a Product entity to an InventoryResponse.
     * Computes lowStock inline: true when quantity is at or below the reorder threshold.
     *
     * @param product source entity
     * @return mapped InventoryResponse
     */
    private InventoryResponse toInventoryResponse(Product product) {
        return InventoryResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .category(product.getCategory())
                .brandId(product.getBrand() != null ? product.getBrand().getId() : null)
                .quantity(product.getStockQuantity())
                .reorderThreshold(product.getReorderThreshold())
                .lowStock(product.getStockQuantity() <= product.getReorderThreshold())
                .updatedAt(product.getUpdatedAt())
                .updatedBy(product.getInventoryUpdatedBy())
                .build();
    }

    /**
     * Maps a ProductBatch entity to a BatchResponse DTO.
     *
     * @param batch source entity
     * @return mapped BatchResponse
     */
    private BatchResponse toBatchResponse(ProductBatch batch) {
        return BatchResponse.builder()
                .id(batch.getId())
                .batchNumber(batch.getBatchNumber())
                .manufacturingDate(batch.getManufacturingDate())
                .expiryDate(batch.getExpiryDate())
                .receivedQuantity(batch.getReceivedQuantity())
                .availableQuantity(batch.getAvailableQuantity())
                .status(batch.getStatus())
                .purchaseOrderItemId(batch.getPurchaseOrderItemId())
                .notes(batch.getNotes())
                .receivedAt(batch.getReceivedAt())
                .build();
    }
}
