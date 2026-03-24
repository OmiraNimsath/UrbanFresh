package com.urbanfresh.exception;

/**
 * Exception Layer – Thrown when a registration attempt uses an already-taken email.
 * Handled globally by the exception handler to return a 409 Conflict response.
 */
public class DuplicateEmailException extends RuntimeException {

    public DuplicateEmailException(String email) {
        super("This email is already registered.");
    }
}
