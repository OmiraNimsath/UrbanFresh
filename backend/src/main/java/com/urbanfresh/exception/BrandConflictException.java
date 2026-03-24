package com.urbanfresh.exception;

/**
 * Exception Layer – Raised when a brand unique field conflicts with an existing brand.
 */
public class BrandConflictException extends RuntimeException {

    public BrandConflictException(String message) {
        super(message);
    }
}