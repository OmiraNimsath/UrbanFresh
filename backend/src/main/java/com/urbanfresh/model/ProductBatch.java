package com.urbanfresh.model;

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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Domain Layer – JPA entity representing a distinct incoming shipment (batch) of a product.
 * Enables FIFO allocation, batch-level quarantine, and full supplier traceability.
 * Maps to the "product_batches" table.
 */
@Entity
@Table(name = "product_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The product this batch belongs to. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** Human-readable identifier from the supplier (e.g., "BATCH-2024-001"). */
    @Column(nullable = false, length = 100)
    private String batchNumber;

    /** Date the product was manufactured, as declared by the supplier. */
    private LocalDate manufacturingDate;

    /** Expiry date for this specific shipment – used as the FIFO sort key. */
    @Column(nullable = false)
    private LocalDate expiryDate;

    /** Total units received in this shipment. */
    @Column(nullable = false)
    private int receivedQuantity;

    /** Units remaining available for allocation; decremented on order placement. */
    @Column(nullable = false)
    private int availableQuantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BatchStatus status = BatchStatus.ACTIVE;

    /**
     * FK to the PurchaseOrderItem that generated this batch.
     * Stored as a plain Long (not a JPA relation) to keep this entity lightweight.
     */
    @Column(name = "purchase_order_item_id")
    private Long purchaseOrderItemId;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime receivedAt;

    @PrePersist
    protected void onCreate() {
        receivedAt = LocalDateTime.now();
    }
}
