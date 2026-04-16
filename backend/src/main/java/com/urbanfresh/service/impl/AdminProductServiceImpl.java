package com.urbanfresh.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.request.ProductRequest;
import com.urbanfresh.dto.response.AdminProductResponse;
import com.urbanfresh.exception.BrandNotFoundException;
import com.urbanfresh.exception.ProductNotFoundException;
import com.urbanfresh.model.Brand;
import com.urbanfresh.model.Product;
import com.urbanfresh.repository.BrandRepository;
import com.urbanfresh.repository.ProductBatchRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.service.AdminProductService;
import com.urbanfresh.service.ProductBatchService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service Layer – Implements admin CRUD operations for products.
 * Maps between ProductRequest / Product entity / AdminProductResponse.
 * All persistence is delegated to ProductRepository.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminProductServiceImpl implements AdminProductService {

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final ProductBatchRepository productBatchRepository;
    private final ProductBatchService productBatchService;

    /**
     * Returns all products sorted by name, paginated, for the admin table.
     *
     * @param page zero-based page index
     * @param size number of items per page
     * @return page of AdminProductResponse
     */
    @Override
    public Page<AdminProductResponse> getProducts(int page, int size) {
        return productRepository
                .findAll(PageRequest.of(page, size, Sort.by("name").ascending()))
                .map(this::toAdminResponse);
    }

    /**
     * Returns a single product by ID or throws ProductNotFoundException.
     *
     * @param id product ID
     * @return AdminProductResponse for the found product
     */
    @Override
    public AdminProductResponse getProductById(Long id) {
        Product product = findOrThrow(id);
        return toAdminResponse(product);
    }

    /**
     * Persists a new product built from the validated request.
     *
     * @param request validated product payload
     * @return AdminProductResponse for the saved product
     */
    @Override
    @Transactional
    public AdminProductResponse createProduct(ProductRequest request) {
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .unit(request.getUnit() != null ? request.getUnit() : com.urbanfresh.model.PricingUnit.PER_ITEM)
                .category(request.getCategory())
            .brand(resolveBrand(request.getBrandId()))
                .imageUrl(request.getImageUrl())
                .featured(request.isFeatured())
                .expiryDate(request.getExpiryDate())
                .stockQuantity(request.getStockQuantity())
                .discountPercentage(request.getDiscountPercentage() != null ? request.getDiscountPercentage() : 0)
                .build();

        Product saved = productRepository.save(product);

        // Auto-create the first batch if an expiry date and stock quantity are provided.
        // Reset stockQuantity to 0 first — createBatch will increment it by the batch quantity,
        // which avoids a double-count (product.stockQuantity already equals the initial qty).
        if (saved.getExpiryDate() != null && saved.getStockQuantity() > 0) {
            int initialQty = saved.getStockQuantity();
            saved.setStockQuantity(0);
            productRepository.save(saved);
            String batchNumber = String.format("BATCH-%d-001", saved.getId());
            productBatchService.createBatch(
                    saved.getId(),
                    batchNumber,
                    null,
                    saved.getExpiryDate(),
                    initialQty,
                    null
            );
            log.info("Auto-created initial batch {} for product ID {}", batchNumber, saved.getId());
        }

        return toAdminResponse(saved);
    }

    /**
     * Replaces all editable fields of an existing product and saves.
     * Full replacement (PUT semantics) — every field is overwritten.
     *
     * @param id      ID of the product to update
     * @param request new values
     * @return AdminProductResponse after update
     */
    @Override
    @Transactional
    public AdminProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = findOrThrow(id);

        java.time.LocalDate oldExpiryDate = product.getExpiryDate();

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setUnit(request.getUnit() != null ? request.getUnit() : com.urbanfresh.model.PricingUnit.PER_ITEM);
        product.setCategory(request.getCategory());
        product.setBrand(resolveBrand(request.getBrandId()));
        product.setImageUrl(request.getImageUrl());
        product.setFeatured(request.isFeatured());
        product.setExpiryDate(request.getExpiryDate());
        product.setStockQuantity(request.getStockQuantity());
        
        if (request.getDiscountPercentage() != null) {
            product.setDiscountPercentage(request.getDiscountPercentage());
        } else {
            product.setDiscountPercentage(0);
        }

        // By default, full update implies approval by an admin unless otherwise specified
        product.setApprovalStatus(com.urbanfresh.model.ApprovalStatus.APPROVED);

        Product saved = productRepository.save(product);

        // If the expiry date changed, update the oldest batch's expiry date to match
        java.time.LocalDate newExpiryDate = saved.getExpiryDate();
        if (newExpiryDate != null && !newExpiryDate.equals(oldExpiryDate)) {
            productBatchRepository.findByProductIdOrderByExpiryDateAsc(saved.getId())
                    .stream().findFirst().ifPresent(oldestBatch -> {
                        oldestBatch.setExpiryDate(newExpiryDate);
                        productBatchRepository.save(oldestBatch);
                        log.info("Updated oldest batch ID {} expiry to {} for product ID {}",
                                oldestBatch.getId(), newExpiryDate, saved.getId());
                    });
        }

        return toAdminResponse(saved);
    }

    /**
     * Deletes the product if it exists; throws ProductNotFoundException otherwise.
     *
     * @param id product ID to delete
     */
    @Override
    public void deleteProduct(Long id) {
        findOrThrow(id);
        productRepository.deleteById(id);
    }

    /**
     * Toggles the hidden flag on a product.
     * When hidden, the product is excluded from all customer-facing queries.
     *
     * @param id product ID
     * @return updated response with the new hidden state
     */
    @Override
    public AdminProductResponse toggleHidden(Long id) {
        Product product = findOrThrow(id);
        product.setHidden(!product.isHidden());
        return toAdminResponse(productRepository.save(product));
    }

    @Override
    public Page<AdminProductResponse> getPendingProducts(int page, int size) {
        return productRepository.findByApprovalStatus(
                com.urbanfresh.model.ApprovalStatus.PENDING,
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        ).map(this::toAdminResponse);
    }

    @Override
    @Transactional
    public AdminProductResponse approveProduct(Long id) {
        Product product = findOrThrow(id);
        product.setApprovalStatus(com.urbanfresh.model.ApprovalStatus.APPROVED);
        Product saved = productRepository.save(product);

        // Create the initial batch from the stock quantity and expiry date the supplier provided.
        // Mirror the same zero-then-createBatch pattern used in createProduct so stock is not doubled.
        if (saved.getExpiryDate() != null && saved.getStockQuantity() > 0) {
            int initialQty = saved.getStockQuantity();
            saved.setStockQuantity(0);
            productRepository.save(saved);
            long batchCount = productBatchRepository.countByProductId(saved.getId());
            String batchNumber = String.format("BATCH-%d-%03d", saved.getId(), batchCount + 1);
            productBatchService.createBatch(
                    saved.getId(),
                    batchNumber,
                    null,
                    saved.getExpiryDate(),
                    initialQty,
                    null
            );
            // Reload so the response reflects the batch-derived stock quantity
            saved = findOrThrow(id);
        }

        return toAdminResponse(saved);
    }

    @Override
    public AdminProductResponse rejectProduct(Long id) {
        Product product = findOrThrow(id);
        AdminProductResponse response = toAdminResponse(product);
        response.setApprovalStatus("REJECTED");
        productRepository.delete(product);
        return response;
    }

    /**
     * Surgical discount PATCH — updates ONLY the discountPercentage field.
     * Every other product attribute (name, price, brand, description, imageUrl,
     * featured, unit, category, expiryDate, stockQuantity, approvalStatus) is
     * left completely unchanged. This prevents the expiry-dashboard discount
     * action from accidentally overwriting unrelated product metadata.
     *
     * @param id                 product to update
     * @param discountPercentage new discount value (0–100)
     */
    @Override
    public AdminProductResponse applyDiscount(Long id, int discountPercentage) {
        if (discountPercentage < 0 || discountPercentage > 100) {
            throw new IllegalArgumentException(
                    "Discount percentage must be between 0 and 100, got: " + discountPercentage);
        }
        Product product = findOrThrow(id);
        product.setDiscountPercentage(discountPercentage);   // the ONLY mutation
        return toAdminResponse(productRepository.save(product));
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /** Fetch product by ID or throw a typed 404 exception. */
    private Product findOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    /**
     * Resolve optional brand ID to entity.
     *
     * @param brandId optional brand ID
     * @return resolved Brand entity or null for unbranded products
     */
    private Brand resolveBrand(Long brandId) {
        if (brandId == null) {
            return null;
        }
        return brandRepository.findById(brandId)
                .orElseThrow(() -> new BrandNotFoundException(brandId));
    }

    /** Maps a Product entity to the admin response DTO (includes stockQuantity). */
    private AdminProductResponse toAdminResponse(Product product) {
        Brand brand = product.getBrand();
        return AdminProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .unit(product.getUnit())
                .category(product.getCategory())
                .brandId(brand != null ? brand.getId() : null)
                .brandName(brand != null ? brand.getName() : null)
                .brandCode(brand != null ? brand.getCode() : null)
                .imageUrl(product.getImageUrl())
                .featured(product.isFeatured())
                .hidden(product.isHidden())
                .expiryDate(product.getExpiryDate())
                .earliestExpiryDate(productBatchRepository.findEarliestExpiryDateByProductId(product.getId()).orElse(null))
                .stockQuantity(product.getStockQuantity())
                .discountPercentage(product.getDiscountPercentage())
                .approvalStatus(product.getApprovalStatus() != null ? product.getApprovalStatus().name() : "APPROVED")
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
