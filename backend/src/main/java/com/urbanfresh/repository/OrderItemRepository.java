package com.urbanfresh.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.urbanfresh.model.OrderItem;

import java.math.BigDecimal;

/**
 * Repository Layer – Spring Data JPA repository for OrderItem entities.
 * Order items are typically accessed via the parent Order (cascade),
 * but this repository is available for direct queries when needed.
 */
@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /**
     * Calculates the total sales for products belonging to the brands assigned to a specific supplier.
     * Only counts items from orders that are past the pending/unpaid stage.
     *
     * @param supplierId the ID of the supplier user
     * @return the sum of line totals, or null if no sales found
     */
    @Query("SELECT SUM(oi.lineTotal) FROM OrderItem oi " +
           "JOIN oi.product p " +
           "JOIN p.brand b " +
           "JOIN SupplierBrand sb ON sb.brand.id = b.id " +
           "WHERE sb.supplier.id = :supplierId " +
           "AND oi.order.status IN (com.urbanfresh.model.OrderStatus.CONFIRMED, com.urbanfresh.model.OrderStatus.PROCESSING, " +
           "com.urbanfresh.model.OrderStatus.READY, com.urbanfresh.model.OrderStatus.OUT_FOR_DELIVERY, com.urbanfresh.model.OrderStatus.DELIVERED)") 
    BigDecimal calculateTotalSalesForSupplier(@Param("supplierId") Long supplierId);
}
