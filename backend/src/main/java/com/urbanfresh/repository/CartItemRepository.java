package com.urbanfresh.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.urbanfresh.model.CartItem;

/**
 * Repository Layer – Data access for CartItem entities.
 * Ownership-scoped finder prevents customers from accessing each other's cart items.
 */
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    /**
     * Find a cart item by its ID, but only if it belongs to the given customer.
     * Used to enforce ownership before any update or delete operation.
     *
     * @param id         the CartItem primary key
     * @param customerId the User primary key of the expected owner
     * @return an Optional containing the item, or empty if not found or not owned by this customer
     */
    Optional<CartItem> findByIdAndCartCustomerId(Long id, Long customerId);
}
