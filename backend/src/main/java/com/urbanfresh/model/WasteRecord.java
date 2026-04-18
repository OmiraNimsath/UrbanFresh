package com.urbanfresh.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * Domain Layer – Records a single waste event: a batch (or legacy product) that expired
 * with remaining unsold stock. Written by BatchExpiryScheduler at the moment stock is
 * deducted so the Waste Report always has an accurate audit trail even after the product's
 * stockQuantity is zeroed out.
 */
@Entity
@Table(name = "waste_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WasteRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The product whose batch expired with remaining stock. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /**
     * The specific batch that expired (null for pre-batch legacy products
     * that had no ProductBatch rows).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private ProductBatch batch;

    /** Number of units that expired unsold. */
    @Column(nullable = false)
    private int wastedQuantity;

    /** Price per unit at the time of waste (snapshot — product price may change later). */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerUnit;

    /** Total monetary waste: pricePerUnit × wastedQuantity. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal wastedValue;

    /** The expiry date of the batch/product (used for monthly grouping in waste report). */
    @Column(nullable = false)
    private LocalDate expiryDate;

    /** Timestamp when this waste record was created by the scheduler. */
    @Column(nullable = false, updatable = false)
    private LocalDateTime recordedAt;

    @PrePersist
    private void prePersist() {
        recordedAt = LocalDateTime.now();
    }
}
