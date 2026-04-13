package com.urbanfresh.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urbanfresh.dto.response.NotificationResponse;
import com.urbanfresh.service.NotificationService;

import lombok.RequiredArgsConstructor;

/**
 * Controller Layer – Exposes notification endpoints for authenticated customers.
 * Route prefix: /api/notifications
 * Access: ROLE_CUSTOMER only (enforced via @PreAuthorize on each method).
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Returns all notifications for the authenticated customer, newest first.
     * GET /api/notifications
     *
     * @param authentication Spring Security principal — used to extract caller's email
     * @return 200 OK with list of NotificationResponse (empty list when none exist)
     */
    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(Authentication authentication) {
        return ResponseEntity.ok(
                notificationService.getMyNotifications(authentication.getName()));
    }

    /**
     * Returns the count of unread notifications for the authenticated customer.
     * Used by the notification bell badge in the frontend.
     * GET /api/notifications/unread-count
     *
     * @param authentication Spring Security principal
     * @return 200 OK with plain long count
     */
    @GetMapping("/unread-count")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Long> getUnreadCount(Authentication authentication) {
        return ResponseEntity.ok(
                notificationService.countUnread(authentication.getName()));
    }

    /**
     * Marks a single notification as read.
     * Enforces ownership — returns 404 when the notification does not belong to the caller.
     * PATCH /api/notifications/{id}/read
     *
     * @param id             path variable — notification ID to mark as read
     * @param authentication Spring Security principal
     * @return 200 OK with the updated NotificationResponse
     */
    @PatchMapping("/{id}/read")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(
                notificationService.markAsRead(id, authentication.getName()));
    }

    /**
     * Marks all of the authenticated customer's notifications as read.
     * POST /api/notifications/read-all
     *
     * @param authentication Spring Security principal
     * @return 204 No Content on success
     */
    @PostMapping("/read-all")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
