package com.urbanfresh.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.urbanfresh.model.OrderStatus;
import com.urbanfresh.model.OrderStatusHistory;

/**
 * Handles persistence of order status transition audit records.
 * Layer: Repository
 */
@Repository
public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {

	/**
	 * Returns all status changes for an order with admin actor data eagerly loaded.
	 *
	 * @param orderId target order ID
	 * @return newest-first status history entries
	 */
	@EntityGraph(attributePaths = "changedByAdmin")
	List<OrderStatusHistory> findByOrderIdOrderByChangedAtDesc(Long orderId);

	/**
	 * Returns history rows for the given orders and target statuses ordered by latest change first.
	 *
	 * @param orderIds target order IDs
	 * @param statuses statuses to include (e.g. DELIVERED/RETURNED)
	 * @return status history entries across matching orders
	 */
	List<OrderStatusHistory> findByOrderIdInAndNewStatusInOrderByChangedAtDesc(
			List<Long> orderIds,
			List<OrderStatus> statuses
	);
}
