package com.urbanfresh.service;

import java.util.List;

import com.urbanfresh.dto.response.NotificationResponse;
import com.urbanfresh.model.Order;
import com.urbanfresh.model.OrderStatus;

/**
 * Service Layer – Contract for in-app notification operations.
 * Notifications are created on order status changes and read by customers
 * via the dashboard.
 */
public interface NotificationService {

    /**
     * Creates and persists a notification for the order's customer
     * reflecting the given new status.
     *
     * @param order     the order whose status changed
     * @param newStatus the status the order transitioned to
     */
    void createOrderStatusNotification(Order order, OrderStatus newStatus);

    /**
     * Returns all notifications for the authenticated customer, newest first.
     *
     * @param customerEmail email from the JWT principal
     * @return list of notification DTOs; empty when none exist
     */
    List<NotificationResponse> getMyNotifications(String customerEmail);

    /**
     * Returns the count of unread notifications for the authenticated customer.
     *
     * @param customerEmail email from the JWT principal
     * @return unread notification count
     */
    long countUnread(String customerEmail);

    /**
     * Marks a single notification as read.
     * Enforces ownership — a customer can only mark their own notifications.
     *
     * @param notificationId ID of the notification to mark as read
     * @param customerEmail  email from the JWT principal
     * @return the updated notification DTO
     */
    NotificationResponse markAsRead(Long notificationId, String customerEmail);

    /**
     * Marks all of the authenticated customer's notifications as read.
     *
     * @param customerEmail email from the JWT principal
     */
    void markAllAsRead(String customerEmail);
}
