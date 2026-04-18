package com.urbanfresh.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.urbanfresh.model.PurchaseOrderItem;

/**
 * Repository Layer – Spring Data JPA repository for PurchaseOrderItem entities.
 * Allows saving individual line items when the supplier provides batch metadata.
 */
@Repository
public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, Long> {
}
