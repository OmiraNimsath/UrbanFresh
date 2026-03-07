package com.urbanfresh.model;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Domain Layer – JPA entity representing a single line item inside an Order.
 * Snapshots the product name and unit price at purchase time so the order
 * history remains accurate even if the Product is later edited or deleted.
 * Maps to the "order_items" table in MySQL.
 */
@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The parent order this line item belongs to. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    /**
     * Reference to the product — kept for stock deduction and reporting.
     * Nullable so historical order items survive product deletion.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    /** Snapshot of product name at purchase time. */
    @Column(nullable = false, length = 150)
    private String productName;

    /** Snapshot of unit price at purchase time to protect historical totals. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private int quantity;

    /** Derived total for this line: unitPrice × quantity. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;
}
