package com.urbanfresh.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.request.InventoryUpdateRequest;
import com.urbanfresh.dto.response.InventoryResponse;
import com.urbanfresh.exception.ProductNotFoundException;
import com.urbanfresh.model.Product;
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

        Product saved = productRepository.save(product);
        return toInventoryResponse(saved);
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
                .quantity(product.getStockQuantity())
                .reorderThreshold(product.getReorderThreshold())
                .lowStock(product.getStockQuantity() <= product.getReorderThreshold())
                .updatedAt(product.getUpdatedAt())
                .updatedBy(product.getInventoryUpdatedBy())
                .build();
    }
}
