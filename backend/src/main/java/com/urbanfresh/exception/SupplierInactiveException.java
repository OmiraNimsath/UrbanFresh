package com.urbanfresh.exception;

/**
 * Exception Layer – Raised when an inactive supplier attempts to authenticate.
 */
public class SupplierInactiveException extends RuntimeException {

    public SupplierInactiveException() {
        super("Supplier account is inactive. Please contact an administrator.");
    }
}
