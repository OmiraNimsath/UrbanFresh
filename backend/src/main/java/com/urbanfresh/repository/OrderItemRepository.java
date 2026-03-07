package com.urbanfresh.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.urbanfresh.model.OrderItem;

/**
 * Repository Layer – Spring Data JPA repository for OrderItem entities.
 * Order items are typically accessed via the parent Order (cascade),
 * but this repository is available for direct queries when needed.
 */
@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
