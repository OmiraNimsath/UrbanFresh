package com.urbanfresh.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer - Lightweight payment tracking payload used by checkout polling.
 * Carries charge.updated webhook acknowledgement and latest persisted payment status per order.
 */
@Getter
@Builder
public class PaymentTrackingStatusResponse {

    /** Order ID being tracked. */
    private Long orderId;

    /** Latest PaymentIntent ID associated with the order, if any. */
    private String paymentIntentId;

    /** Latest persisted payment status (PENDING | PAID | FAILED). */
    private String paymentStatus;

    /** True when a charge.updated webhook event has been persisted. */
    private boolean chargeUpdatedEventReceived;

    /** Timestamp when the charge.updated event was observed (nullable). */
    private LocalDateTime chargeUpdatedEventReceivedAt;

    /** True when payment state reached a terminal value (PAID or FAILED). */
    private boolean terminal;
}