package com.urbanfresh.exception;

/**
 * Exception Layer – Raised when a requested brand does not exist.
 */
public class BrandNotFoundException extends RuntimeException {

    public BrandNotFoundException(Long brandId) {
        super("Brand not found with ID: " + brandId);
    }
}