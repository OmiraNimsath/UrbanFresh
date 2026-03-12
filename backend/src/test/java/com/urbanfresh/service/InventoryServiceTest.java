package com.urbanfresh.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import com.urbanfresh.dto.request.InventoryUpdateRequest;
import com.urbanfresh.dto.response.InventoryResponse;
import com.urbanfresh.exception.ProductNotFoundException;
import com.urbanfresh.model.Product;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.service.impl.InventoryServiceImpl;

/**
 * Unit tests for InventoryServiceImpl.
 * Covers: inventory retrieval, stock updates, audit recording,
 * low-stock flag derivation, and rejection of unknown product IDs.
 */
@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    /**
     * Builds a reusable product fixture with quantity=50 and reorderThreshold=10.
     * Each test constructs its own instance to prevent shared mutable state.
     */
    private Product buildProduct() {
        return Product.builder()
                .id(1L)
                .name("Organic Bananas")
                .category("Fruits")
                .price(BigDecimal.valueOf(299.00))
                .stockQuantity(50)
                .reorderThreshold(10)
                .build();
    }

    // ── getAllInventory ────────────────────────────────────────────────────────

    @Test
    void getAllInventory_returnsMappedResponseForEveryProduct() {
        when(productRepository.findAll(any(Sort.class))).thenReturn(List.of(buildProduct()));

        List<InventoryResponse> result = inventoryService.getAllInventory();

        assertEquals(1, result.size());
        InventoryResponse entry = result.get(0);
        assertEquals(1L, entry.getProductId());
        assertEquals("Organic Bananas", entry.getProductName());
        assertEquals("Fruits", entry.getCategory());
        assertEquals(50, entry.getQuantity());
        assertEquals(10, entry.getReorderThreshold());
        assertFalse(entry.isLowStock(), "quantity 50 > threshold 10 should not flag low stock");
    }

    @Test
    void getAllInventory_returnsEmptyListWhenNoProductsExist() {
        when(productRepository.findAll(any(Sort.class))).thenReturn(List.of());

        List<InventoryResponse> result = inventoryService.getAllInventory();

        assertTrue(result.isEmpty());
    }

    // ── updateInventory – success ─────────────────────────────────────────────

    @Test
    void updateInventory_persistsNewQuantityAndReorderThreshold() {
        InventoryUpdateRequest request = new InventoryUpdateRequest(80, 20);
        Product product = buildProduct();
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryResponse result = inventoryService.updateInventory(1L, request, "admin@urbanfresh.com");

        assertEquals(80, result.getQuantity());
        assertEquals(20, result.getReorderThreshold());
        verify(productRepository).save(product);
    }

    @Test
    void updateInventory_recordsAdminEmailAsUpdatedBy() {
        InventoryUpdateRequest request = new InventoryUpdateRequest(30, 5);
        when(productRepository.findById(1L)).thenReturn(Optional.of(buildProduct()));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryResponse result = inventoryService.updateInventory(1L, request, "manager@urbanfresh.com");

        assertEquals("manager@urbanfresh.com", result.getUpdatedBy());
    }

    @Test
    void updateInventory_acceptsZeroQuantityAndZeroThreshold() {
        InventoryUpdateRequest request = new InventoryUpdateRequest(0, 0);
        when(productRepository.findById(1L)).thenReturn(Optional.of(buildProduct()));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryResponse result = inventoryService.updateInventory(1L, request, "admin@urbanfresh.com");

        assertEquals(0, result.getQuantity());
        assertEquals(0, result.getReorderThreshold());
    }

    // ── updateInventory – low-stock flag derivation ───────────────────────────

    @Test
    void updateInventory_lowStockFalse_whenQuantityAboveThreshold() {
        InventoryUpdateRequest request = new InventoryUpdateRequest(80, 20);
        when(productRepository.findById(1L)).thenReturn(Optional.of(buildProduct()));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryResponse result = inventoryService.updateInventory(1L, request, "admin@urbanfresh.com");

        assertFalse(result.isLowStock());
    }

    @Test
    void updateInventory_lowStockTrue_whenQuantityEqualsThreshold() {
        InventoryUpdateRequest request = new InventoryUpdateRequest(10, 10);
        when(productRepository.findById(1L)).thenReturn(Optional.of(buildProduct()));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryResponse result = inventoryService.updateInventory(1L, request, "admin@urbanfresh.com");

        assertTrue(result.isLowStock(), "quantity == threshold must be treated as low stock");
    }

    @Test
    void updateInventory_lowStockTrue_whenQuantityBelowThreshold() {
        InventoryUpdateRequest request = new InventoryUpdateRequest(5, 10);
        when(productRepository.findById(1L)).thenReturn(Optional.of(buildProduct()));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryResponse result = inventoryService.updateInventory(1L, request, "admin@urbanfresh.com");

        assertTrue(result.isLowStock());
    }

    @Test
    void updateInventory_lowStockTrue_whenBothQuantityAndThresholdAreZero() {
        InventoryUpdateRequest request = new InventoryUpdateRequest(0, 0);
        when(productRepository.findById(1L)).thenReturn(Optional.of(buildProduct()));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryResponse result = inventoryService.updateInventory(1L, request, "admin@urbanfresh.com");

        // 0 <= 0 → treated as low stock so admins are prompted to set a useful threshold
        assertTrue(result.isLowStock());
    }

    // ── updateInventory – product not found ───────────────────────────────────

    @Test
    void updateInventory_throwsProductNotFoundException_forUnknownProductId() {
        InventoryUpdateRequest request = new InventoryUpdateRequest(10, 5);
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        ProductNotFoundException thrown = assertThrows(ProductNotFoundException.class,
                () -> inventoryService.updateInventory(99L, request, "admin@urbanfresh.com"));

        assertTrue(thrown.getMessage().contains("99"), "Exception message must reference the missing product ID");
        // save must never be called when the product does not exist
        verify(productRepository, never()).save(any());
    }
}
