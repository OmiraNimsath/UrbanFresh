package com.urbanfresh.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.urbanfresh.model.Payment;

/**
 * Repository Layer – Data access for Payment entities.
 * Provides lookup by Stripe PaymentIntent ID for webhook processing.
 */
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /**
     * Find a payment record by its Stripe PaymentIntent ID.
     * Used during webhook processing to locate the local record for an event.
     *
     * @param stripePaymentIntentId the Stripe PaymentIntent ID from the webhook payload
     * @return the matching Payment, if it was persisted during PaymentIntent creation
     */
    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);

    /**
     * Returns the latest payment attempt for the given order.
     * Useful for checkout tracking when an order has retries.
     *
     * @param orderId order ID
     * @return most recently created payment attempt, if available
     */
    Optional<Payment> findTopByOrderIdOrderByCreatedAtDesc(Long orderId);
}
