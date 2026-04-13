package com.urbanfresh.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.response.NotificationResponse;
import com.urbanfresh.exception.NotificationNotFoundException;
import com.urbanfresh.exception.UserNotFoundException;
import com.urbanfresh.model.Notification;
import com.urbanfresh.model.Order;
import com.urbanfresh.model.OrderStatus;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.NotificationRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.NotificationService;

import lombok.RequiredArgsConstructor;

/**
 * Service Layer – Implements in-app notification creation and retrieval.
 * Notifications are created whenever an order status changes and are surfaced
 * to the customer via the dashboard. Ownership is enforced on every read operation.
 */
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Builds a customer-friendly message for the given status and persists a
     * Notification linked to the order's customer.
     * Called from OrderServiceImpl and PaymentServiceImpl after every status save.
     *
     * @param order     the updated order (must have customer eagerly available)
     * @param newStatus the status the order just transitioned to
     */
    @Override
    @Transactional
    public void createOrderStatusNotification(Order order, OrderStatus newStatus) {
        String message = buildMessage(order.getId(), newStatus);

        notificationRepository.save(Notification.builder()
                .customer(order.getCustomer())
                .orderId(order.getId())
                .message(message)
                .build());
    }

    /**
     * Returns all notifications for the authenticated customer, newest first.
     *
     * @param customerEmail email from the JWT principal
     * @return list of notification response DTOs; empty when none exist
     */
    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String customerEmail) {
        User customer = resolveCustomer(customerEmail);
        return notificationRepository
                .findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Returns the count of unread notifications for the authenticated customer.
     *
     * @param customerEmail email from the JWT principal
     * @return number of unread notifications
     */
    @Override
    @Transactional(readOnly = true)
    public long countUnread(String customerEmail) {
        User customer = resolveCustomer(customerEmail);
        return notificationRepository.countByCustomerIdAndIsReadFalse(customer.getId());
    }

    /**
     * Marks a single notification as read.
     * Uses a combined id+customerId lookup to enforce ownership without a
     * separate ownership check query.
     *
     * @param notificationId ID of the notification to mark read
     * @param customerEmail  email from the JWT principal
     * @return updated notification DTO
     * @throws NotificationNotFoundException when the notification does not exist
     *         or belongs to a different customer
     */
    @Override
    @Transactional
    public NotificationResponse markAsRead(Long notificationId, String customerEmail) {
        User customer = resolveCustomer(customerEmail);

        Notification notification = notificationRepository
                .findByIdAndCustomerId(notificationId, customer.getId())
                .orElseThrow(() -> new NotificationNotFoundException(notificationId));

        // No-op when already read — avoids an unnecessary dirty write
        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }

        return toResponse(notification);
    }

    /**
     * Marks all of the authenticated customer's unread notifications as read.
     * Uses a single bulk UPDATE to avoid loading entities into memory.
     *
     * @param customerEmail email from the JWT principal
     */
    @Override
    @Transactional
    public void markAllAsRead(String customerEmail) {
        User customer = resolveCustomer(customerEmail);
        notificationRepository.markAllReadByCustomerId(customer.getId());
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Resolves the User entity for the given email.
     * Centralised to keep all five public methods DRY.
     */
    private User resolveCustomer(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Customer not found: " + email));
    }

    /**
     * Maps a Notification entity to its response DTO.
     */
    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .orderId(n.getOrderId())
                .message(n.getMessage())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }

    /**
     * Builds a human-readable notification message for each order status.
     * The message is stored once at creation time so the customer sees the same
     * text regardless of future order edits.
     *
     * @param orderId   order ID to include in the message
     * @param newStatus the new order status
     * @return ready-to-display notification string
     */
    private String buildMessage(Long orderId, OrderStatus newStatus) {
        return switch (newStatus) {
            case CONFIRMED      -> "Your order #" + orderId + " has been confirmed - payment received!";
            case PROCESSING     -> "Your order #" + orderId + " is now being processed.";
            case READY          -> "Your order #" + orderId + " is packed and ready to be dispatched.";
            case OUT_FOR_DELIVERY -> "Your order #" + orderId + " is out for delivery!";
            case DELIVERED      -> "Your order #" + orderId + " has been delivered. Enjoy!";
            case RETURNED       -> "Your order #" + orderId + " has been returned and is under review.";
            case CANCELLED      -> "Your order #" + orderId + " has been cancelled.";
            // PENDING is the initial placement state - no notification needed for it
            default             -> "Your order #" + orderId + " status updated to " + newStatus + ".";
        };
    }
}
