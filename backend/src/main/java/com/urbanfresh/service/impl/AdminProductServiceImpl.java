package com.urbanfresh.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.urbanfresh.dto.request.ProductRequest;
import com.urbanfresh.dto.response.AdminProductResponse;
import com.urbanfresh.exception.BrandNotFoundException;
import com.urbanfresh.exception.ProductNotFoundException;
import com.urbanfresh.model.Brand;
import com.urbanfresh.model.Product;
import com.urbanfresh.repository.BrandRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.service.AdminProductService;

import lombok.RequiredArgsConstructor;

/**
 * Service Layer – Implements admin CRUD operations for products.
 * Maps between ProductRequest / Product entity / AdminProductResponse.
 * All persistence is delegated to ProductRepository.
 */
@Service
@RequiredArgsConstructor
public class AdminProductServiceImpl implements AdminProductService {

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;

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
                .build();

        return toAdminResponse(productRepository.save(product));
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
    public AdminProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = findOrThrow(id);

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
        // By default, full update implies approval by an admin unless otherwise specified
        product.setApprovalStatus(com.urbanfresh.model.ApprovalStatus.APPROVED);

        return toAdminResponse(productRepository.save(product));
    }

    /**
     * Deletes the product if it exists; throws ProductNotFoundException otherwise.
     *
     * @param id product ID to delete
     */
    @Override
    public void deleteProduct(Long id) {
        // Verify existence before delete so a 404 is returned for unknown IDs
        findOrThrow(id);
        productRepository.deleteById(id);
    }

    @Override
    public Page<AdminProductResponse> getPendingProducts(int page, int size) {
        return productRepository.findByApprovalStatus(
                com.urbanfresh.model.ApprovalStatus.PENDING,
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        ).map(this::toAdminResponse);
    }

    @Override
    public AdminProductResponse approveProduct(Long id) {
        Product product = findOrThrow(id);
        product.setApprovalStatus(com.urbanfresh.model.ApprovalStatus.APPROVED);
        product.setStockQuantity(0); // Initialize with 0 stock as requested
        return toAdminResponse(productRepository.save(product));
    }

    @Override
    public AdminProductResponse rejectProduct(Long id) {
        Product product = findOrThrow(id);
        AdminProductResponse response = toAdminResponse(product);
        response.setApprovalStatus("REJECTED");
        productRepository.delete(product);
        return response;
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
                .expiryDate(product.getExpiryDate())
                .stockQuantity(product.getStockQuantity())
                .approvalStatus(product.getApprovalStatus() != null ? product.getApprovalStatus().name() : "APPROVED")
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
