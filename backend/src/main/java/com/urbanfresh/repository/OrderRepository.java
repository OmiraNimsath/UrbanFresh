package com.urbanfresh.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.urbanfresh.model.Order;

/**
 * Repository Layer – Spring Data JPA repository for Order entities.
 * Provides query methods for retrieving a customer's order history.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * Retrieve all orders placed by a specific customer, newest first.
     *
     * @param customerId the ID of the authenticated customer
     * @return list of orders belonging to that customer
     */
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    /**
     * Returns all orders in descending creation order with customer eagerly loaded.
     * EntityGraph prevents N+1 queries when mapping admin order summaries.
     *
     * @param pageable paging instructions
     * @return page of orders for admin views
     */
    @EntityGraph(attributePaths = "customer")
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Loads a single order with customer, items, and product references for admin review.
     *
     * @param id order ID
     * @return optional order with all required relations eagerly loaded
     */
    @EntityGraph(attributePaths = {"customer", "items", "items.product"})
    Optional<Order> findDetailedById(Long id);
}
