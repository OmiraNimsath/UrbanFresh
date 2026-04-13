package com.urbanfresh.exception;

/**
 * Exception Layer – Thrown when a notification cannot be found by ID,
 * or when a customer attempts to access a notification they do not own.
 */
public class NotificationNotFoundException extends RuntimeException {

    /**
     * Creates an exception for a missing or inaccessible notification.
     *
     * @param notificationId the requested notification ID
     */
    public NotificationNotFoundException(Long notificationId) {
        super("Notification not found with id: " + notificationId);
    }
}
