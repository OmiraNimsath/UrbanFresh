package com.urbanfresh.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.request.UpdatePurchaseOrderStatusDto;
import com.urbanfresh.dto.response.PurchaseOrderDto;
import com.urbanfresh.dto.response.PurchaseOrderItemDto;
import com.urbanfresh.exception.PurchaseOrderAccessException;
import com.urbanfresh.exception.PurchaseOrderNotFoundException;
import com.urbanfresh.model.Brand;
import com.urbanfresh.model.PurchaseOrder;
import com.urbanfresh.model.SupplierBrand;
import com.urbanfresh.repository.PurchaseOrderRepository;
import com.urbanfresh.repository.SupplierBrandRepository;
import com.urbanfresh.service.SupplierPurchaseOrderService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service Layer - Implementation for supplier purchase orders logic.
 * Handles fetching brand-scoped purchase orders and status updates.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SupplierPurchaseOrderServiceImpl implements SupplierPurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierBrandRepository supplierBrandRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrderDto> getPurchaseOrdersForSupplier(Long supplierId) {
        List<Long> brandIds = getBrandIdsForSupplier(supplierId);
        
        if (brandIds.isEmpty()) {
            return List.of();
        }

        List<PurchaseOrder> orders = purchaseOrderRepository.findByBrandIdInOrderByCreatedAtDesc(brandIds);
        return orders.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PurchaseOrderDto updateShipmentStatus(Long supplierId, Long orderId, UpdatePurchaseOrderStatusDto updateDto) {
        List<Long> brandIds = getBrandIdsForSupplier(supplierId);

        // First, verify if the purchase order exists at all to give correct 404 vs 403
        PurchaseOrder order = purchaseOrderRepository.findById(orderId)
                .orElseThrow(() -> new PurchaseOrderNotFoundException("Purchase Order not found with ID: " + orderId));

        // Scoping check (Scenario 3 - Brand scoping enforced)
        if (!brandIds.contains(order.getBrand().getId())) {
            log.warn("Supplier ID {} attempted to access unauthorized Purchase Order ID {}", supplierId, orderId);
            throw new PurchaseOrderAccessException("You do not have permission to access or update this purchase order.");
        }

        // Apply update (Scenario 2 - Update shipment status)
        order.setStatus(updateDto.getStatus());
        if (updateDto.getEstimatedDeliveryTimeline() != null) {
            order.setEstimatedDeliveryTimeline(updateDto.getEstimatedDeliveryTimeline());
        }

        PurchaseOrder updatedOrder = purchaseOrderRepository.save(order);
        log.info("Supplier ID {} updated Purchase Order ID {} status to {}", supplierId, orderId, updateDto.getStatus());

        return mapToDto(updatedOrder);
    }

    /**
     * Helper: Extractor for the specific supplier's associated brand IDs.
     */
    private List<Long> getBrandIdsForSupplier(Long supplierId) {
        return supplierBrandRepository.findBySupplierId(supplierId).stream()
                .map(SupplierBrand::getBrand)
                .map(Brand::getId)
                .collect(Collectors.toList());
    }

    /**
     * Helper: Maps a PurchaseOrder entity back to its response DTO.
     */
    private PurchaseOrderDto mapToDto(PurchaseOrder entity) {
        List<PurchaseOrderItemDto> itemsDto = entity.getItems().stream()
                .map(item -> PurchaseOrderItemDto.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .build())
                .collect(Collectors.toList());

        return PurchaseOrderDto.builder()
                .id(entity.getId())
                .brandId(entity.getBrand().getId())
                .brandName(entity.getBrand().getName())
                .status(entity.getStatus())
                .estimatedDeliveryTimeline(entity.getEstimatedDeliveryTimeline())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .items(itemsDto)
                .build();
    }
}