package com.urbanfresh.exception;

/**
 * Exception Layer – Raised when supplier-brand assignments are invalid.
 */
public class BrandAssignmentException extends RuntimeException {

    public BrandAssignmentException(String message) {
        super(message);
    }
}
