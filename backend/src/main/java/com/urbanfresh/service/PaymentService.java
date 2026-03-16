package com.urbanfresh.service;

import com.urbanfresh.dto.request.CreatePaymentIntentRequest;
import com.urbanfresh.dto.response.PaymentIntentResponse;

/**
 * Service Layer – Contract for Stripe payment operations.
 * Decouples the controller from Stripe SDK details and order mutation logic.
 */
public interface PaymentService {

    /**
     * Creates a Stripe PaymentIntent for the given order and persists a pending Payment record.
     * The returned clientSecret is passed to the React frontend to mount Stripe Elements.
     * Amount is always resolved from the persisted order — never from client input.
     *
     * @param request       validated payload containing the orderId
     * @param customerEmail email from the JWT principal — used to verify order ownership
     * @return PaymentIntentResponse containing clientSecret, publishableKey, and paymentIntentId
     */
    PaymentIntentResponse createPaymentIntent(CreatePaymentIntentRequest request, String customerEmail);

    /**
     * Handles an incoming Stripe webhook event payload.
     * Verifies the Stripe-Signature header to ensure the request is genuine,
     * then routes to the appropriate update logic based on event type:
     *  - payment_intent.succeeded  → marks payment PAID, order CONFIRMED
     *  - payment_intent.payment_failed → marks payment FAILED
     *
     * @param payload   raw JSON body exactly as received from Stripe (must not be parsed first)
     * @param sigHeader value of the "Stripe-Signature" HTTP header
     */
    void handleWebhookEvent(String payload, String sigHeader);
}
