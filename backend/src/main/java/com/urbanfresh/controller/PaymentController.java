package com.urbanfresh.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urbanfresh.dto.request.CreatePaymentIntentRequest;
import com.urbanfresh.dto.response.PaymentIntentResponse;
import com.urbanfresh.service.PaymentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller Layer – Exposes Stripe payment endpoints.
 *
 * POST /api/payments/create-intent  → authenticated customer creates a PaymentIntent
 * POST /api/payments/webhook        → public Stripe webhook receiver (no JWT — Stripe signs it)
 *
 * The webhook endpoint must receive the raw request body so Stripe signature
 * verification works correctly — it is consumed as a plain String here.
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Creates a Stripe PaymentIntent for the authenticated customer's order.
     * Returns a clientSecret that the React frontend passes to stripe.confirmCardPayment().
     *
     * @param request        validated payload with orderId
     * @param authentication Spring Security principal — provides the customer email
     * @return 200 OK with PaymentIntentResponse (clientSecret, publishableKey, paymentIntentId)
     */
    @PostMapping("/create-intent")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<PaymentIntentResponse> createPaymentIntent(
            @Valid @RequestBody CreatePaymentIntentRequest request,
            Authentication authentication) {

        String customerEmail = authentication.getName();
        PaymentIntentResponse response = paymentService.createPaymentIntent(request, customerEmail);
        return ResponseEntity.ok(response);
    }

    /**
     * Stripe webhook receiver — called by Stripe when a payment event occurs.
     * Must be PUBLIC (no JWT) and must receive the raw body without Spring parsing.
     * Stripe-Signature header is used by PaymentService to verify the payload is genuine.
     *
     * @param payload   raw JSON body from Stripe
     * @param sigHeader Stripe-Signature header value
     * @return 200 OK on success; exceptions propagate to GlobalExceptionHandler
     */
    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        paymentService.handleWebhookEvent(payload, sigHeader);
        return ResponseEntity.ok().build();
    }
}
