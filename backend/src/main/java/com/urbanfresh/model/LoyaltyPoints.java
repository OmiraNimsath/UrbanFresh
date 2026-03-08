package com.urbanfresh.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Domain Layer – JPA entity representing a customer's loyalty points ledger.
 * One record per customer; updated each time an order is placed.
 * Conversion rule: 1 point awarded for every LKR 100 spent.
 * Maps to the "loyalty_points" table in MySQL.
 */
@Entity
@Table(name = "loyalty_points")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyPoints {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The customer who owns this loyalty ledger (one-to-one with User). */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User customer;

    /** Total lifetime points earned (never decrements — historical record). */
    @Column(nullable = false)
    @Builder.Default
    private int earnedPoints = 0;

    /** Total points redeemed by the customer. Reserved for future sprint use. */
    @Column(nullable = false)
    @Builder.Default
    private int redeemedPoints = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /** Computed balance available for redemption (earned minus redeemed). */
    public int getTotalPoints() {
        return earnedPoints - redeemedPoints;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
