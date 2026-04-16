package com.urbanfresh.service.impl;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.request.ConfirmDeliveryRequest;
import com.urbanfresh.dto.request.ConfirmDeliveryRequest.ItemBatchOverride;
import com.urbanfresh.dto.request.CreatePurchaseOrderRequest;
import com.urbanfresh.dto.response.PurchaseOrderDto;
import com.urbanfresh.dto.response.PurchaseOrderItemDto;
import com.urbanfresh.exception.BrandNotFoundException;
import com.urbanfresh.exception.ProductNotFoundException;
import com.urbanfresh.exception.PurchaseOrderNotFoundException;
import com.urbanfresh.model.Brand;
import com.urbanfresh.model.Product;
import com.urbanfresh.model.PurchaseOrder;
import com.urbanfresh.model.PurchaseOrderItem;
import com.urbanfresh.model.PurchaseOrderStatus;
import com.urbanfresh.repository.BrandRepository;
import com.urbanfresh.repository.ProductBatchRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.PurchaseOrderRepository;
import com.urbanfresh.service.AdminPurchaseOrderService;
import com.urbanfresh.service.ProductBatchService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of AdminPurchaseOrderService.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminPurchaseOrderServiceImpl implements AdminPurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;
    private final ProductBatchService productBatchService;

    @Override
    @Transactional
    public PurchaseOrderDto createPurchaseOrder(CreatePurchaseOrderRequest request) {
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new BrandNotFoundException(request.getBrandId()));

        PurchaseOrder order = PurchaseOrder.builder()
                .brand(brand)
                .status(PurchaseOrderStatus.PENDING)
                .build();

        List<PurchaseOrderItem> items = request.getItems().stream().map(reqItem -> {
            Product product = productRepository.findById(reqItem.getProductId())
                    .orElseThrow(() -> new ProductNotFoundException(reqItem.getProductId()));
            
            if (!product.getBrand().getId().equals(brand.getId())) {
                throw new IllegalArgumentException("Product ID " + product.getId() + " does not belong to Brand ID " + brand.getId());
            }

            return PurchaseOrderItem.builder()
                    .purchaseOrder(order)
                    .product(product)
                    .quantity(reqItem.getQuantity())
                    .unitPrice(product.getPrice()) // Snapshot current price for the PO
                    .batchNumber(reqItem.getBatchNumber())
                    .manufacturingDate(reqItem.getManufacturingDate())
                    .supplierExpiryDate(reqItem.getSupplierExpiryDate())
                    .build();
        }).collect(Collectors.toList());

        order.setItems(items);
        PurchaseOrder savedOrder = purchaseOrderRepository.save(order);
        log.info("Admin created Purchase Order ID {} for Brand ID {}", savedOrder.getId(), brand.getId());

        return mapToDto(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrderDto> getAllPurchaseOrders() {
        // Find all, perhaps sort by latest
        return purchaseOrderRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    @Override
    @Transactional
    public PurchaseOrderDto confirmDeliveryAndStock(Long orderId, String adminUsername, ConfirmDeliveryRequest request) {
        PurchaseOrder order = purchaseOrderRepository.findById(orderId)
                .orElseThrow(() -> new PurchaseOrderNotFoundException("Purchase Order ID " + orderId + " not found."));

        if (order.getStatus() != PurchaseOrderStatus.DELIVERED) {
            throw new IllegalStateException("Only DELIVERED orders can be marked as COMPLETED by admin.");
        }

        // Build a lookup map from itemId → override (if any were provided)
        Map<Long, ItemBatchOverride> overrideMap = (request != null && request.getItems() != null)
                ? request.getItems().stream()
                        .filter(o -> o.getItemId() != null)
                        .collect(Collectors.toMap(ItemBatchOverride::getItemId, o -> o))
                : Map.of();

        // Create a ProductBatch per item and increment legacy stockQuantity
        for (PurchaseOrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setInventoryUpdatedBy(adminUsername);
            productRepository.save(product);

            // Merge override fields onto the PO item (override wins over stored value)
            ItemBatchOverride override = overrideMap.get(item.getId());
            if (override != null) {
                if (override.getBatchNumber() != null && !override.getBatchNumber().isBlank()) {
                    item.setBatchNumber(override.getBatchNumber());
                }
                if (override.getManufacturingDate() != null) {
                    item.setManufacturingDate(override.getManufacturingDate());
                }
                if (override.getSupplierExpiryDate() != null) {
                    item.setSupplierExpiryDate(override.getSupplierExpiryDate());
                }
            }

            // Use batch number from PO item if provided; otherwise auto-generate using incrementing index
            long existingBatchCount = productBatchRepository.countByProductId(product.getId());
            String batchNumber = String.format("BATCH-%d-%03d", product.getId(), existingBatchCount + 1);

            // Expiry date is required to create a batch; skip batch creation if not provided
            if (item.getSupplierExpiryDate() != null) {
                productBatchService.createBatch(
                        product.getId(),
                        batchNumber,
                        item.getManufacturingDate(),
                        item.getSupplierExpiryDate(),
                        item.getQuantity(),
                        item.getId()
                );
            } else {
                // Legacy fallback: no expiry date supplied — just update stockQuantity directly
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
                log.warn("PO item ID {} has no supplierExpiryDate — stock added without batch tracking", item.getId());
            }
        }

        order.setStatus(PurchaseOrderStatus.COMPLETED);
        PurchaseOrder savedOrder = purchaseOrderRepository.save(order);
        log.info("Admin {} confirmed delivery of Purchase Order ID {}. Stock updated.", adminUsername, order.getId());

        return mapToDto(savedOrder);
    }
    private PurchaseOrderDto mapToDto(PurchaseOrder entity) {
        List<PurchaseOrderItemDto> itemsDto = entity.getItems().stream()
                .map(item -> PurchaseOrderItemDto.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .batchNumber(item.getBatchNumber())
                        .manufacturingDate(item.getManufacturingDate())
                        .supplierExpiryDate(item.getSupplierExpiryDate())
                        .build())
                .collect(Collectors.toList());

        return PurchaseOrderDto.builder()
                .id(entity.getId())
                .brandId(entity.getBrand().getId())
                .brandName(entity.getBrand().getName())
                .status(entity.getStatus())
                .estimatedDeliveryTimeline(entity.getEstimatedDeliveryTimeline())
                .rejectionReason(entity.getRejectionReason())
                .supplierNotice(entity.getSupplierNotice())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .items(itemsDto)
                .build();
    }
}