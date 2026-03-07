package com.urbanfresh.repository;

import java.util.List;

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
}
