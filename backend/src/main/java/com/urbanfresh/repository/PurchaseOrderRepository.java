package com.urbanfresh.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.urbanfresh.model.PurchaseOrder;

/**
 * Repository Layer - JPA repository for managing PurchaseOrder entities.
 */
@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    /** Fetch all purchase orders for a list of brands. */
    List<PurchaseOrder> findByBrandIdInOrderByCreatedAtDesc(List<Long> brandIds);

    /** Fetch a specific purchase order only if it belongs to one of the given brands. */
    Optional<PurchaseOrder> findByIdAndBrandIdIn(Long id, List<Long> brandIds);
}