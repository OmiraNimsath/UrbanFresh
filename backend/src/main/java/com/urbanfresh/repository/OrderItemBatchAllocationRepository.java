package com.urbanfresh.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.urbanfresh.model.OrderItemBatchAllocation;

/**
 * Repository Layer – Spring Data JPA repository for OrderItemBatchAllocation entities.
 * Used to retrieve all batch allocations belonging to a specific order item (audit trail).
 */
@Repository
public interface OrderItemBatchAllocationRepository extends JpaRepository<OrderItemBatchAllocation, Long> {

    /**
     * Returns all batch allocations for a given order item.
     * Used when building order detail responses to show which batches supplied each line item.
     *
     * @param orderItemId the ID of the OrderItem
     * @return list of allocations for that item; empty list if none (legacy orders)
     */
    List<OrderItemBatchAllocation> findByOrderItemId(Long orderItemId);
}
