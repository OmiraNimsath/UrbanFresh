package com.urbanfresh.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Domain Layer – JPA entity that records a Stripe payment attempt for an order.
 * One order may have multiple Payment rows (e.g. first attempt failed, retry succeeded).
 * Maps to the "payments" table in MySQL.
 */
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The order this payment attempt belongs to. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    /**
     * Stripe PaymentIntent ID (e.g. "pi_3Abc…").
     * Unique per PaymentIntent; used to correlate webhook events with local records.
     */
    @Column(nullable = false, unique = true, length = 100)
    private String stripePaymentIntentId;

    /** Amount charged in the smallest currency unit (pence/cents, etc.). */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /** ISO 4217 currency code, e.g. "usd". Lowercased as Stripe returns it. */
    @Column(nullable = false, length = 3)
    private String currency;

    /** Outcome of this payment attempt (PENDING → PAID | FAILED). */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    /** Set when charge.updated webhook is received for this PaymentIntent. */
    @Column(nullable = true)
    private LocalDateTime chargeUpdatedEventReceivedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Populate timestamp before first insert. */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
