package com.urbanfresh.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Response returned after a Stripe PaymentIntent is created on the backend.
 * The frontend uses the clientSecret to mount Stripe Elements and confirm the payment.
 * The publishableKey is returned here so the frontend never needs to hard-code it.
 */
@Getter
@Builder
public class PaymentIntentResponse {

    /** Stripe PaymentIntent client secret — passed to stripe.confirmCardPayment() on the frontend. */
    private String clientSecret;

    /** Stripe publishable key — used to initialise the Stripe.js library on the frontend. */
    private String publishableKey;

    /** The PaymentIntent ID (pi_…) for reference / display. */
    private String paymentIntentId;

    /** Order ID this PaymentIntent was created for. */
    private Long orderId;
}
