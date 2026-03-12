package com.urbanfresh.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.urbanfresh.model.Cart;

/**
 * Repository Layer – Data access for Cart entities.
 * Provides finder by customer ID to avoid unnecessary joins.
 */
public interface CartRepository extends JpaRepository<Cart, Long> {

    /**
     * Find the cart that belongs to the given customer.
     *
     * @param customerId the User primary key
     * @return an Optional containing the cart, or empty if the customer has no cart yet
     */
    Optional<Cart> findByCustomerId(Long customerId);
}
