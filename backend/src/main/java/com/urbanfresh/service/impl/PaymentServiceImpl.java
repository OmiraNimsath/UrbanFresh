package com.urbanfresh.service.impl;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.urbanfresh.dto.request.CreatePaymentIntentRequest;
import com.urbanfresh.dto.response.PaymentIntentResponse;
import com.urbanfresh.exception.OrderNotFoundException;
import com.urbanfresh.exception.PaymentAccessException;
import com.urbanfresh.exception.PaymentException;
import com.urbanfresh.exception.UserNotFoundException;
import com.urbanfresh.model.Order;
import com.urbanfresh.model.OrderStatus;
import com.urbanfresh.model.Payment;
import com.urbanfresh.model.PaymentStatus;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.OrderRepository;
import com.urbanfresh.repository.PaymentRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.PaymentService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service Layer – Implements Stripe payment processing.
 * Handles PaymentIntent creation (server-side) and webhook event processing.
 * Order status changes are only made after Stripe confirms the event via a signed webhook.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    // Stripe amount is always in the smallest currency unit (cents / pence).
    // LKR has no sub-unit so multiply by 100 gives the correct integer representation.
    private static final long STRIPE_CURRENCY_MULTIPLIER = 100L;
    private static final String STRIPE_CURRENCY = "lkr";

    private static final String EVENT_PAYMENT_SUCCEEDED = "payment_intent.succeeded";
    private static final String EVENT_PAYMENT_FAILED    = "payment_intent.payment_failed";

    @Value("${stripe.publishable-key}")
    private String publishableKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    private final OrderRepository    orderRepository;
    private final PaymentRepository  paymentRepository;
    private final UserRepository     userRepository;

    /**
     * Creates a Stripe PaymentIntent for a customer-owned order.
     * Steps:
     *  1. Resolve customer from JWT email.
     *  2. Load the order and verify ownership — never trust client-supplied amounts.
     *  3. Call Stripe to create a PaymentIntent with the server-side amount.
     *  4. Persist a PENDING Payment record linked to the order.
     *  5. Return the clientSecret + publishableKey to the frontend.
     *
     * @param request       orderId from the client
     * @param customerEmail authenticated customer email
     * @return PaymentIntentResponse with clientSecret, publishableKey, paymentIntentId
     */
    @Override
    @Transactional
    public PaymentIntentResponse createPaymentIntent(CreatePaymentIntentRequest request, String customerEmail) {

        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new UserNotFoundException("Customer not found: " + customerEmail));

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new OrderNotFoundException(request.getOrderId()));

        // Ownership check — prevent one customer from initiating payment on another's order
        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new PaymentAccessException("You are not authorised to pay for this order.");
        }

        // Only PENDING orders can be paid for; CONFIRMED means already paid
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new PaymentException(
                    "Order " + order.getId() + " cannot be paid — current status: " + order.getStatus());
        }

        // Convert BigDecimal total to Stripe integer amount (smallest currency unit)
        long stripeAmount = order.getTotalAmount()
                .multiply(BigDecimal.valueOf(STRIPE_CURRENCY_MULTIPLIER))
                .longValue();

        PaymentIntent intent;
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(stripeAmount)
                    .setCurrency(STRIPE_CURRENCY)
                    // Store the order ID in Stripe metadata so webhooks can be traced
                    .putMetadata("orderId", String.valueOf(order.getId()))
                    .putMetadata("customerEmail", customerEmail)
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build())
                    .build();

            intent = PaymentIntent.create(params);

        } catch (StripeException ex) {
            log.error("Stripe PaymentIntent creation failed for orderId={}: {}", order.getId(), ex.getMessage());
            throw new PaymentException("Payment gateway error — could not create payment session.", ex);
        }

        // Persist a PENDING record so we can correlate the upcoming webhook event
        paymentRepository.save(Payment.builder()
                .order(order)
                .stripePaymentIntentId(intent.getId())
                .amount(order.getTotalAmount())
                .currency(STRIPE_CURRENCY)
                .status(PaymentStatus.PENDING)
                .build());

        log.info("PaymentIntent {} created for orderId={}", intent.getId(), order.getId());

        return PaymentIntentResponse.builder()
                .clientSecret(intent.getClientSecret())
                .publishableKey(publishableKey)
                .paymentIntentId(intent.getId())
                .orderId(order.getId())
                .build();
    }

    /**
     * Processes an inbound Stripe webhook event.
     * Signature verification is mandatory — requests without a valid signature are rejected.
     * Only processes event types relevant to payment lifecycle; all others are silently ignored.
     *
     * @param payload   raw JSON request body (must not be parsed before reaching this method)
     * @param sigHeader Stripe-Signature HTTP header value
     */
    @Override
    @Transactional
    public void handleWebhookEvent(String payload, String sigHeader) {

        Event event;
        try {
            // Stripe signature verification — protects against forged webhook payloads
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException ex) {
            log.warn("Invalid Stripe webhook signature: {}", ex.getMessage());
            throw new PaymentException("Webhook signature verification failed.");
        }

        String eventType = event.getType();
        log.info("Stripe webhook received: type={}", eventType);

        // Deserialise the PaymentIntent embedded in the event
        PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer()
                .getObject()
                .orElse(null);

        if (intent == null) {
            log.warn("Webhook event {} has no deserializable PaymentIntent — skipping.", eventType);
            return;
        }

        switch (eventType) {
            case EVENT_PAYMENT_SUCCEEDED -> handlePaymentSucceeded(intent);
            case EVENT_PAYMENT_FAILED    -> handlePaymentFailed(intent);
            default -> log.debug("Unhandled Stripe event type: {} — no action taken.", eventType);
        }
    }

    // ──────────────────────────────────────────
    //  Private event handlers
    // ──────────────────────────────────────────

    /**
     * Marks the Payment record as PAID and transitions the associated Order to CONFIRMED.
     *
     * @param intent succeeded PaymentIntent from the Stripe event
     */
    private void handlePaymentSucceeded(PaymentIntent intent) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(intent.getId())
                .orElseGet(() -> {
                    // Safety: if the record was not found (e.g. race/missed creation),
                    // log and skip rather than crashing the webhook endpoint.
                    log.warn("No local Payment record for PaymentIntent {} — cannot confirm order.", intent.getId());
                    return null;
                });

        if (payment == null) return;

        payment.setStatus(PaymentStatus.PAID);
        paymentRepository.save(payment);

        Order order = payment.getOrder();
        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaymentStatus(PaymentStatus.PAID);
        orderRepository.save(order);

        log.info("Payment succeeded: PaymentIntent={}, orderId={} → CONFIRMED", intent.getId(), order.getId());
    }

    /**
     * Marks the Payment record as FAILED.
     * The order status remains PENDING — the customer may retry payment.
     *
     * @param intent failed PaymentIntent from the Stripe event
     */
    private void handlePaymentFailed(PaymentIntent intent) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(intent.getId())
                .orElseGet(() -> {
                    log.warn("No local Payment record for failed PaymentIntent {} — skipping.", intent.getId());
                    return null;
                });

        if (payment == null) return;

        payment.setStatus(PaymentStatus.FAILED);
        paymentRepository.save(payment);

        // Update the order's paymentStatus field so the customer sees FAILED in their dashboard
        Order order = payment.getOrder();
        order.setPaymentStatus(PaymentStatus.FAILED);
        orderRepository.save(order);

        log.info("Payment failed: PaymentIntent={}, orderId={} — order stays PENDING, paymentStatus=FAILED",
                intent.getId(), order.getId());
    }
}
