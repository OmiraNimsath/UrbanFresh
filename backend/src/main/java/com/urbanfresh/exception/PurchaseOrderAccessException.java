package com.urbanfresh.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception Layer - Thrown when a supplier tries to access a purchase order that does not belong to their brands.
 * Mapped to HTTP 403 Forbidden.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class PurchaseOrderAccessException extends RuntimeException {

    public PurchaseOrderAccessException(String message) {
        super(message);
    }
}