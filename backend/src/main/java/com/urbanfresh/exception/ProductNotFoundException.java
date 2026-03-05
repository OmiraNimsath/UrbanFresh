package com.urbanfresh.exception;

/**
 * Exception Layer – Thrown when a requested product cannot be found by its ID.
 * Mapped to HTTP 404 Not Found by GlobalExceptionHandler.
 */
public class ProductNotFoundException extends RuntimeException {

    /**
     * @param id the product ID that was not found
     */
    public ProductNotFoundException(Long id) {
        super("Product not found with id: " + id);
    }
}
