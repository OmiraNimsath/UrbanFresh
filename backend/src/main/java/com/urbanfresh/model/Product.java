package com.urbanfresh.model;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Domain Layer – JPA entity representing a product in the UrbanFresh store.
 * Tracks pricing, expiry, and whether the product is featured on the landing page.
 * Maps to the "products" table in MySQL.
 */
@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-readable product name displayed in cards and listings. */
    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Retail price in the store's base currency. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(length = 80)
    private String category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    /** URL to the product image (CDN path or relative asset path). */
    @Column(length = 500)
    private String imageUrl;

    /**
     * When true the product appears in the "Featured Products" section on the landing page.
     * Defaults to false so only explicitly promoted items surface.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean featured = false;

    /**
     * Pricing unit — determines how the price is displayed (per item, per kg, etc.).
     * Stored as a string for readability and schema stability on rename.
     * Defaults to PER_ITEM for backwards compatibility with existing rows.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PricingUnit unit = PricingUnit.PER_ITEM;

    /** Expiry date used to surface near-expiry offers; null if the product does not expire. */
    private LocalDate expiryDate;

    @Column(nullable = false)
    @Builder.Default
    private int stockQuantity = 0;

    /** Minimum stock level below which a restock alert should be raised. Defaults to 0. */
    @Column(nullable = false)
    @Builder.Default
    private int reorderThreshold = 0;

    /** Email of the admin who last updated inventory fields (stockQuantity / reorderThreshold). */
    @Column(length = 150)
    private String inventoryUpdatedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /** Automatically populate timestamps before first persist. */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    /** Automatically refresh updatedAt on every update. */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
