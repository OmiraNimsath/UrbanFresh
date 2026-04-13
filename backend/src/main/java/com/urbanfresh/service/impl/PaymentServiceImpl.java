package com.urbanfresh.service.impl;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stripe.exception.EventDataObjectDeserializationException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Charge;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.urbanfresh.dto.request.CreatePaymentIntentRequest;
import com.urbanfresh.dto.response.PaymentIntentResponse;
import com.urbanfresh.dto.response.PaymentTrackingStatusResponse;
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
import com.urbanfresh.service.LoyaltyService;
import com.urbanfresh.service.NotificationService;
import com.urbanfresh.service.PaymentService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service Layer – Implements Stripe payment processing.
 * Handles PaymentIntent creation (server-side) and webhook event processing.
 * Order status changes are only made after Stripe confirms the event via a
 * signed webhook.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    // Stripe sandbox only accepts currencies enabled for the account.
    // USD is universally accepted; we convert from LKR using the configured rate.
    private static final String STRIPE_CURRENCY = "usd";   // sent to Stripe API
    private static final String DB_CURRENCY      = "lkr";  // stored in payments table

    private static final String EVENT_PAYMENT_SUCCEEDED = "payment_intent.succeeded";
    private static final String EVENT_PAYMENT_FAILED = "payment_intent.payment_failed";
    private static final String EVENT_CHARGE_UPDATED = "charge.updated";

    @Value("${stripe.publishable-key}")
    private String publishableKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    /**
     * Exchange rate: how many LKR equal 1 USD. Configured in
     * application.properties.
     */
    @Value("${stripe.lkr-to-usd-rate:311.33}")
    private double lkrToUsdRate;

    /** Minimum order total in LKR before payment is accepted. */
    @Value("${app.min-order-amount-lkr:200}")
    private int minOrderAmountLkr;

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final LoyaltyService loyaltyService;
    private final NotificationService notificationService;

    /**
     * Creates a Stripe PaymentIntent for a customer-owned order.
     * Steps:
     * 1. Resolve customer from JWT email.
     * 2. Load the order and verify ownership — never trust client-supplied amounts.
     * 3. Call Stripe to create a PaymentIntent with the server-side amount.
     * 4. Persist a PENDING Payment record linked to the order.
     * 5. Return the clientSecret + publishableKey to the frontend.
     *
     * @param request       orderId from the client
     * @param customerEmail authenticated customer email
     * @return PaymentIntentResponse with clientSecret, publishableKey,
     *         paymentIntentId
     */
    @Override
    @Transactional
    public PaymentIntentResponse createPaymentIntent(CreatePaymentIntentRequest request, String customerEmail) {

        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new UserNotFoundException("Customer not found: " + customerEmail));

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new OrderNotFoundException(request.getOrderId()));

        // Ownership check — prevent one customer from initiating payment on another's
        // order
        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new PaymentAccessException("You are not authorised to pay for this order.");
        }

        // Only PENDING orders can be paid for; CONFIRMED means already paid
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new PaymentException(
                    "Order " + order.getId() + " cannot be paid — current status: " + order.getStatus());
        }

        // Minimum order amount check — prevents Stripe amount_too_small errors
        // and enforces the business rule. Configured via app.min-order-amount-lkr.
        if (order.getTotalAmount().compareTo(BigDecimal.valueOf(minOrderAmountLkr)) < 0) {
            throw new PaymentException(
                    "Minimum order amount is Rs. " + minOrderAmountLkr
                            + ". Your order total is Rs. " + order.getTotalAmount().toPlainString() + ".");
        }

        // Convert LKR order total → USD cents for Stripe.
        // Formula: usdCents = round(lkrAmount / lkrToUsdRate * 100)
        // Example: Rs 3000 / 300 = $10.00 USD = 1000 cents
        BigDecimal lkrAmount = order.getTotalAmount();
        long stripeAmount = lkrAmount
                .divide(BigDecimal.valueOf(lkrToUsdRate), 6, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(0, java.math.RoundingMode.HALF_UP)
                .longValue();

        log.info("Currency conversion: Rs {} LKR → {} USD cents (rate: {})",
                lkrAmount, stripeAmount, lkrToUsdRate);

        PaymentIntent intent;
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(stripeAmount)
                    .setCurrency(STRIPE_CURRENCY)
                    // Restrict to card payments only — matches the card-only checkout UI
                    .addPaymentMethodType("card")
                    // Store the original LKR amount in metadata for dashboard traceability
                    .putMetadata("orderId", String.valueOf(order.getId()))
                    .putMetadata("customerEmail", customerEmail)
                    .putMetadata("amountLKR", lkrAmount.toPlainString())
                    .putMetadata("amountUSDCents", String.valueOf(stripeAmount))
                    .putMetadata("lkrToUsdRate", String.valueOf(lkrToUsdRate))
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
                .currency(DB_CURRENCY)
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
     * Signature verification is mandatory — requests without a valid signature are
     * rejected.
     * Only processes event types relevant to payment lifecycle; all others are
     * silently ignored.
     *
     * @param payload   raw JSON request body (must not be parsed before reaching
     *                  this method)
     * @param sigHeader Stripe-Signature HTTP header value
     */
    @Override
    @Transactional
    public void handleWebhookEvent(String payload, String sigHeader) {

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException ex) {
            log.warn("Invalid Stripe webhook signature: {}", ex.getMessage());
            throw new PaymentException("Webhook signature verification failed.");
        }

        String eventType = event.getType();

        // Only process events relevant to payment lifecycle tracking.
        if (!eventType.equals(EVENT_CHARGE_UPDATED)
            && !eventType.equals(EVENT_PAYMENT_SUCCEEDED)
            && !eventType.equals(EVENT_PAYMENT_FAILED)) {
            return;
        }

        log.info("Processing webhook: type={}", eventType);

        StripeObject stripeObject = extractStripeObject(event);

        if (stripeObject == null) {
            log.warn("Event {} has no deserializable Stripe object even after fallback.", eventType);
            return;
        }

        switch (eventType) {
            case EVENT_CHARGE_UPDATED -> {
                if (stripeObject instanceof Charge charge) {
                    handleChargeUpdated(charge);
                } else {
                    log.warn("Event {} did not contain a Charge payload.", eventType);
                }
            }
            case EVENT_PAYMENT_SUCCEEDED -> {
                if (stripeObject instanceof PaymentIntent intent) {
                    handlePaymentSucceeded(intent);
                } else {
                    log.warn("Event {} did not contain a PaymentIntent payload.", eventType);
                }
            }
            case EVENT_PAYMENT_FAILED -> {
                if (stripeObject instanceof PaymentIntent intent) {
                    handlePaymentFailed(intent);
                } else {
                    log.warn("Event {} did not contain a PaymentIntent payload.", eventType);
                }
            }
        }
    }

        /**
         * Returns latest webhook-backed tracking state for a customer-owned order.
         *
         * @param orderId target order ID
         * @param customerEmail authenticated customer email
         * @return latest payment tracking status
         */
        @Override
        @Transactional(readOnly = true)
        public PaymentTrackingStatusResponse getPaymentTrackingStatus(Long orderId, String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
            .orElseThrow(() -> new UserNotFoundException("Customer not found: " + customerEmail));

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));

        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new PaymentAccessException("You are not authorised to view payment status for this order.");
        }

        Payment latestPayment = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId)
            .orElse(null);

        PaymentStatus effectiveStatus = resolveEffectivePaymentStatus(order, latestPayment);

        return PaymentTrackingStatusResponse.builder()
            .orderId(order.getId())
            .paymentIntentId(latestPayment != null ? latestPayment.getStripePaymentIntentId() : null)
            .paymentStatus(effectiveStatus.name())
            .chargeUpdatedEventReceived(latestPayment != null
                && latestPayment.getChargeUpdatedEventReceivedAt() != null)
            .chargeUpdatedEventReceivedAt(latestPayment != null
                ? latestPayment.getChargeUpdatedEventReceivedAt()
                : null)
            .terminal(effectiveStatus == PaymentStatus.PAID || effectiveStatus == PaymentStatus.FAILED)
            .build();
        }

    // ──────────────────────────────────────────
    // Private event handlers
    // ──────────────────────────────────────────

    /**
     * Attempts safe Stripe object deserialization with an unsafe fallback.
     * Fallback keeps webhook processing resilient when endpoint API version
     * differs from stripe-java model version.
     *
     * @param event verified Stripe event
     * @return StripeObject payload or null when deserialization fails completely
     */
    private StripeObject extractStripeObject(Event event) {
        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
        StripeObject stripeObject = deserializer.getObject().orElse(null);
        if (stripeObject != null) {
            return stripeObject;
        }

        try {
            return deserializer.deserializeUnsafe();
        } catch (EventDataObjectDeserializationException ex) {
            log.warn("Unsafe deserialization failed for event type {}: {}", event.getType(), ex.getMessage());
            return null;
        } catch (RuntimeException ex) {
            log.warn("Failed unsafe deserialization for event type {}: {}", event.getType(), ex.getMessage());
            return null;
        }
    }

    /**
     * Marks that charge.updated was acknowledged for this PaymentIntent.
     *
     * @param charge updated Charge payload from webhook
     */
    private void handleChargeUpdated(Charge charge) {
        String paymentIntentId = charge.getPaymentIntent();

        if (paymentIntentId == null || paymentIntentId.isBlank()) {
            log.warn("charge.updated received without payment_intent id.");
            return;
        }

        Payment payment = paymentRepository.findByStripePaymentIntentId(paymentIntentId)
            .orElse(null);

        if (payment == null) {
            log.warn("No local Payment record for charge.updated PaymentIntent {}.", paymentIntentId);
            return;
        }

        if (payment.getChargeUpdatedEventReceivedAt() == null) {
            payment.setChargeUpdatedEventReceivedAt(java.time.LocalDateTime.now());
        }

        String chargeStatus = charge.getStatus();
        boolean paid = Boolean.TRUE.equals(charge.getPaid());

        if (paid || "succeeded".equalsIgnoreCase(chargeStatus)) {
            applyPaidState(payment, paymentIntentId, "charge.updated");
            return;
        }

        if ("failed".equalsIgnoreCase(chargeStatus)) {
            applyFailedState(payment, paymentIntentId, "charge.updated");
            return;
        }

        paymentRepository.save(payment);
        log.info("charge.updated event acknowledged: paymentIntentId={}", paymentIntentId);
    }

    /**
     * Marks the Payment record as PAID and transitions the associated Order to
     * CONFIRMED.
     *
     * @param intent succeeded PaymentIntent from the Stripe event
     */
    private void handlePaymentSucceeded(PaymentIntent intent) {
        String paymentIntentId = intent.getId();
        
        Payment payment = paymentRepository.findByStripePaymentIntentId(paymentIntentId)
                .orElse(null);

        if (payment == null) {
            log.error("Payment not found for PaymentIntent: {}", paymentIntentId);
            return;
        }

        applyPaidState(payment, paymentIntentId, EVENT_PAYMENT_SUCCEEDED);
    }

    /**
     * Marks payment/order as paid and confirmed.
     *
     * @param payment payment entity to mutate
     * @param paymentIntentId Stripe PaymentIntent ID for logging
     * @param eventType event source that triggered this transition
     */
    private void applyPaidState(Payment payment, String paymentIntentId, String eventType) {
        Order order = payment.getOrder();
        if (order == null) {
            log.error("Order not found for Payment: {}", payment.getId());
            return;
        }

        // Idempotency guard — both payment_intent.succeeded and charge.updated can call
        // this method for the same payment. Only process once.
        if (order.getStatus() == OrderStatus.CONFIRMED) {
            log.info("Order {} already CONFIRMED — skipping duplicate {} event.", order.getId(), eventType);
            return;
        }

        payment.setStatus(PaymentStatus.PAID);
        paymentRepository.save(payment);

        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaymentStatus(PaymentStatus.PAID);
        orderRepository.save(order);

        notificationService.createOrderStatusNotification(order, OrderStatus.CONFIRMED);

        // Award loyalty points only now — payment is confirmed and the order is CONFIRMED.
        // Awarding here prevents customers from earning points on failed/cancelled payments.
        loyaltyService.awardPoints(order.getCustomer(), order.getTotalAmount());

        log.info("Order confirmed from {}: orderId={}, paymentIntentId={}",
                eventType, order.getId(), paymentIntentId);
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

        if (payment == null)
            return;

        applyFailedState(payment, intent.getId(), EVENT_PAYMENT_FAILED);
    }

    /**
     * Marks payment/order as failed while leaving order lifecycle pending for retry.
     *
     * @param payment payment entity to mutate
     * @param paymentIntentId Stripe PaymentIntent ID for logging
     * @param eventType event source that triggered this transition
     */
    private void applyFailedState(Payment payment, String paymentIntentId, String eventType) {
        payment.setStatus(PaymentStatus.FAILED);
        paymentRepository.save(payment);

        Order order = payment.getOrder();
        if (order == null) {
            log.error("Order not found for Payment: {}", payment.getId());
            return;
        }

        order.setPaymentStatus(PaymentStatus.FAILED);
        orderRepository.save(order);

        log.info("Payment failed from {}: paymentIntentId={}, orderId={} — order stays PENDING",
                eventType, paymentIntentId, order.getId());
    }

    /**
     * Resolves the effective status exposed to checkout tracking.
     * Prefers order.paymentStatus because it is the customer-facing aggregate state.
     *
     * @param order latest persisted order
     * @param latestPayment latest payment attempt (nullable)
     * @return effective payment status
     */
    private PaymentStatus resolveEffectivePaymentStatus(Order order, Payment latestPayment) {
        if (order.getPaymentStatus() != null) {
            return order.getPaymentStatus();
        }

        if (latestPayment != null && latestPayment.getStatus() != null) {
            return latestPayment.getStatus();
        }

        return PaymentStatus.PENDING;
    }
}
