package com.urbanfresh.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.urbanfresh.model.LoyaltyPoints;

/**
 * Repository Layer – Spring Data JPA repository for LoyaltyPoints entities.
 * Provides lookup by customer ID for earning and displaying loyalty data.
 */
@Repository
public interface LoyaltyPointsRepository extends JpaRepository<LoyaltyPoints, Long> {

    /**
     * Find the loyalty ledger for a specific customer.
     *
     * @param userId the customer's user ID
     * @return Optional containing the ledger, or empty if never yet created
     */
    Optional<LoyaltyPoints> findByCustomerId(Long userId);
}
