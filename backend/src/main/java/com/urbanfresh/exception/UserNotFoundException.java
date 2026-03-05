package com.urbanfresh.exception;

/**
 * Exception Layer – Thrown when a user record cannot be found by the given identifier.
 * Mapped to 404 Not Found in GlobalExceptionHandler.
 */
public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(String message) {
        super(message);
    }
}
