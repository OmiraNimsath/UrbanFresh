package com.urbanfresh.model;

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
 * Domain Layer – JPA entity recording which product batch(es) fulfilled an order line item.
 * Provides a full audit trail: supplier batch → PO → order item → customer.
 * Maps to the "order_item_batch_allocations" table.
 */
@Entity
@Table(name = "order_item_batch_allocations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemBatchAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The order item that consumed stock from this batch. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    /** The batch from which stock was drawn. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "batch_id", nullable = false)
    private ProductBatch batch;

    /** Number of units drawn from this batch for this order item. */
    @Column(nullable = false)
    private int allocatedQuantity;

    @Column(nullable = false, updatable = false)
    private LocalDateTime allocatedAt;

    @PrePersist
    protected void onCreate() {
        allocatedAt = LocalDateTime.now();
    }
}
