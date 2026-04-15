package com.urbanfresh.service.impl;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.urbanfresh.dto.response.ProductPageResponse;
import com.urbanfresh.dto.response.ProductResponse;
import com.urbanfresh.dto.response.ProductSuggestionResponse;
import com.urbanfresh.exception.ProductNotFoundException;
import com.urbanfresh.model.Product;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.service.ProductBatchService;
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
    private final ProductBatchService productBatchService;

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
     * Searches the product catalogue with optional name/description search, category filter,
     * sort, and pagination. Null/blank values for search and category disable those filters.
     *
     * @param search   substring search term; null or blank = no filter
     * @param category category to filter by; null or blank = all categories
     * @param sortBy   "price_asc", "price_desc", or anything else defaults to name ASC
     * @param page     zero-based page index
     * @param size     page size
     * @return ProductPageResponse with the product list and pagination metadata
     */
    @Override
    public ProductPageResponse searchProducts(String search, String category, String sortBy, int page, int size) {
        // Convert blank strings to null so the JPQL query skips those filters
        String searchParam   = StringUtils.hasText(search)   ? search.trim()   : null;
        String categoryParam = StringUtils.hasText(category) ? category.trim() : null;

        Sort sort = resolveSort(sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Product> resultPage = productRepository.searchProducts(searchParam, categoryParam, pageable);

        return ProductPageResponse.builder()
                .products(resultPage.getContent().stream().map(this::toResponse).toList())
                .totalElements(resultPage.getTotalElements())
                .totalPages(resultPage.getTotalPages())
                .currentPage(resultPage.getNumber())
                .pageSize(resultPage.getSize())
                .build();
    }

    /**
     * Returns all distinct, non-null category values for the frontend filter dropdown.
     *
     * @return sorted list of category strings
     */
    @Override
    public List<String> getCategories() {
        return productRepository.findAllCategories();
    }

    /**
     * Returns up to 8 lightweight suggestion payloads for the autocomplete dropdown.
     * Returns an empty list immediately when the query is blank or fewer than 2 characters
     * to avoid unnecessary DB round-trips on single-character input.
     *
     * @param query partial product name from the user's search input
     * @return list of up to 8 ProductSuggestionResponse objects
     */
    @Override
    public List<ProductSuggestionResponse> getProductSuggestions(String query) {
        if (!StringUtils.hasText(query) || query.trim().length() < 2) {
            return Collections.emptyList();
        }
        Pageable limit = PageRequest.of(0, 8);
        return productRepository.findNameSuggestions(query.trim(), limit);
    }

    /**
     * Fetches a single product by ID and maps it to a ProductResponse.
     * Throws ProductNotFoundException (-> 404) when the ID does not exist.
     *
     * @param id product primary key
     * @return ProductResponse for the found product
     */
    @Override
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        return toResponse(product);
    }

    /**
     * Translates the sortBy string from the query param into a Spring Data Sort.
     * Defaults to name ASC so the list is always deterministic when no sort is chosen.
     *
     * @param sortBy sort key from the request param
     * @return Sort instance
     */
    private Sort resolveSort(String sortBy) {
        if (sortBy == null) return Sort.by("name").ascending();
        return switch (sortBy) {
            case "price_asc"  -> Sort.by("price").ascending();
            case "price_desc" -> Sort.by("price").descending();
            default           -> Sort.by("name").ascending();
        };
    }

    /**
     * Maps a Product entity to a ProductResponse DTO.
     * Converts raw stockQuantity to a boolean inStock flag to hide warehouse data.
     *
     * @param product the domain entity to map
     * @return populated ProductResponse
     */
    private ProductResponse toResponse(Product product) {
        Optional<LocalDate> earliestExpiry = productBatchService.getEarliestExpiryDate(product.getId());
        int batchStock = productBatchService.getTotalAvailableQuantity(product.getId());

        // A product is in-stock when it has allocatable batch stock.
        // Fall back to legacy stockQuantity for products without batch records.
        boolean inStock = batchStock > 0 || (batchStock == 0 && product.getStockQuantity() > 0
                && !earliestExpiry.isPresent());

        // Near-expiry: any allocatable batch expires within 7 days from today
        boolean hasNearExpiryBatches = earliestExpiry
                .map(d -> !d.isAfter(LocalDate.now().plusDays(7)))
                .orElse(false);

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .unit(product.getUnit())
                .category(product.getCategory())
                .imageUrl(product.getImageUrl())
                .featured(product.isFeatured())
                .expiryDate(product.getExpiryDate())
                .discountPercentage(product.getDiscountPercentage())
                .inStock(inStock)
                .earliestExpiryDate(earliestExpiry.orElse(null))
                .hasNearExpiryBatches(hasNearExpiryBatches)
                .build();
    }
}
