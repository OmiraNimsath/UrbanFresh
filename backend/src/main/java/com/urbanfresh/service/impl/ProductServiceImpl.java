package com.urbanfresh.service.impl;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.urbanfresh.dto.response.ProductResponse;
import com.urbanfresh.model.Product;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.service.ProductService;

import lombok.RequiredArgsConstructor;

/**
 * Service Layer – Concrete implementation of ProductService.
 * Handles business logic for the public landing page product sections.
 * Delegates all persistence to ProductRepository; maps entities to DTOs here.
 */
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    /**
     * Fetches all products with featured=true and maps them to ProductResponse DTOs.
     *
     * @return list of featured product responses, empty list when none are marked featured
     */
    @Override
    public List<ProductResponse> getFeaturedProducts() {
        return productRepository.findByFeaturedTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Fetches in-stock products whose expiry date falls within [today, today + daysAhead].
     * Only returns products with stockQuantity > 0 to avoid showing sold-out offers.
     *
     * @param daysAhead look-ahead window in days
     * @return list of near-expiry product responses ordered by earliest expiry first
     */
    @Override
    public List<ProductResponse> getNearExpiryProducts(int daysAhead) {
        LocalDate today = LocalDate.now();
        LocalDate cutoff = today.plusDays(daysAhead);

        return productRepository
                .findByExpiryDateBetweenAndStockQuantityGreaterThanOrderByExpiryDateAsc(
                        today, cutoff, 0)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Maps a Product entity to a ProductResponse DTO.
     * Converts raw stockQuantity to a boolean inStock flag to hide warehouse data.
     *
     * @param product the domain entity to map
     * @return populated ProductResponse
     */
    private ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .category(product.getCategory())
                .imageUrl(product.getImageUrl())
                .featured(product.isFeatured())
                .expiryDate(product.getExpiryDate())
                // expose availability only — raw quantity is internal warehouse data
                .inStock(product.getStockQuantity() > 0)
                .build();
    }
}
