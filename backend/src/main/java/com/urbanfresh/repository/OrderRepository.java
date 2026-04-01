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
    @EntityGraph(attributePaths = {"customer", "items", "items.product", "assignedDeliveryPerson"})
    Optional<Order> findDetailedById(Long id);

    /**
     * Loads a single order with relations for a specific customer.
     * Used by customer confirmation/detail pages to enforce ownership.
     *
     * @param id order ID
     * @param customerId authenticated customer ID
     * @return optional order when it belongs to the customer
     */
    @EntityGraph(attributePaths = {"customer", "items", "items.product"})
    Optional<Order> findDetailedByIdAndCustomerId(Long id, Long customerId);

    /**
     * Loads a single order with relations for a specific assigned delivery person.
     * Used by delivery details screens to enforce assignment-based access.
     *
     * @param id order ID
     * @param assignedDeliveryPersonId authenticated delivery person ID
     * @return optional order when assignment matches
     */
    @EntityGraph(attributePaths = {"customer", "items", "items.product", "assignedDeliveryPerson"})
    Optional<Order> findDetailedByIdAndAssignedDeliveryPersonId(Long id, Long assignedDeliveryPersonId);

    /**
     * Loads paginated orders assigned to a delivery person, newest first.
     * EntityGraph eagerly fetches customer and items for delivery dashboard cards.
     *
     * @param assignedDeliveryPersonId authenticated delivery person ID
     * @param pageable paging instructions
     * @return page of assigned orders
     */
    @EntityGraph(attributePaths = {"customer", "items", "assignedDeliveryPerson"})
    Page<Order> findByAssignedDeliveryPersonIdOrderByCreatedAtDesc(Long assignedDeliveryPersonId, Pageable pageable);
}
