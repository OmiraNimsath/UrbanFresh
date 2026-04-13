package com.urbanfresh.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.urbanfresh.model.Notification;

/**
 * Repository Layer – Data access for Notification entities.
 * All queries are scoped to a specific customer to enforce data isolation.
 */
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Returns all notifications for a customer, newest first.
     *
     * @param customerId the customer's user ID
     * @return ordered list of notifications
     */
    List<Notification> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    /**
     * Returns a notification only if it belongs to the given customer.
     * Used to enforce ownership before marking as read.
     *
     * @param id         notification ID
     * @param customerId the customer's user ID
     * @return the notification if owned by this customer
     */
    Optional<Notification> findByIdAndCustomerId(Long id, Long customerId);

    /** Count unread notifications for a customer. */
    long countByCustomerIdAndIsReadFalse(Long customerId);

    /**
     * Bulk-marks all of a customer's unread notifications as read.
     * Single UPDATE statement — avoids loading all entities into memory.
     *
     * @param customerId the customer's user ID
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.customer.id = :customerId AND n.isRead = false")
    void markAllReadByCustomerId(@Param("customerId") Long customerId);
}
