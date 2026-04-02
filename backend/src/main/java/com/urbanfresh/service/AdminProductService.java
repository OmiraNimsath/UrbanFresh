package com.urbanfresh.service;

import org.springframework.data.domain.Page;

import com.urbanfresh.dto.request.ProductRequest;
import com.urbanfresh.dto.response.AdminProductResponse;

/**
 * Service Layer – Defines admin CRUD operations for products.
 * Keeps AdminController thin and the persistence layer decoupled (SOLID: DIP).
 */
public interface AdminProductService {

    /**
     * Returns a paginated list of all products for the admin product table.
     *
     * @param page zero-based page index
     * @param size number of items per page
     * @return page of AdminProductResponse (includes stockQuantity and timestamps)
     */
    Page<AdminProductResponse> getProducts(int page, int size);

    /**
     * Returns a single product by its ID.
     *
     * @param id product ID
     * @return AdminProductResponse for the found product
     * @throws com.urbanfresh.exception.ProductNotFoundException if no product with that ID exists
     */
    AdminProductResponse getProductById(Long id);

    /**
     * Creates a new product from the validated request.
     *
     * @param request validated product payload
     * @return AdminProductResponse for the newly persisted product
     */
    AdminProductResponse createProduct(ProductRequest request);

    /**
     * Replaces all editable fields of an existing product.
     *
     * @param id      product ID to update
     * @param request validated product payload with new values
     * @return AdminProductResponse reflecting the updated state
     * @throws com.urbanfresh.exception.ProductNotFoundException if no product with that ID exists
     */
    AdminProductResponse updateProduct(Long id, ProductRequest request);

    /**
     * Retrieves all pending products.
     */
    Page<AdminProductResponse> getPendingProducts(int page, int size);

    /**
     * Approves a product, setting stock to 0.
     */
    AdminProductResponse approveProduct(Long id);

    /**
     * Rejects a product request.
     */
    AdminProductResponse rejectProduct(Long id);

    /**
     * Permanently removes a product from the catalogue.
     *
     * @param id product ID to delete
     * @throws com.urbanfresh.exception.ProductNotFoundException if no product with that ID exists
     */
    void deleteProduct(Long id);
}
