package com.urbanfresh.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import com.stripe.Stripe;

import jakarta.annotation.PostConstruct;

/**
 * Config Layer – Initialises the Stripe Java SDK with the secret key on startup.
 * All Stripe API calls made anywhere in the application will use this key automatically.
 */
@Configuration
public class StripeConfig {

    @Value("${stripe.secret-key}")
    private String secretKey;

    /**
     * Sets the global Stripe API key once the Spring context is ready.
     * Must run before any Stripe SDK call is made.
     */
    @PostConstruct
    public void initStripe() {
        Stripe.apiKey = secretKey;
    }
}
