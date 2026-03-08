package com.urbanfresh.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.urbanfresh.model.LoyaltyPoints;

import jakarta.persistence.LockModeType;

/**
 * Repository Layer – Spring Data JPA repository for LoyaltyPoints entities.
 * Provides lookup by customer ID for earning and displaying loyalty data.
 */
@Repository
public interface LoyaltyPointsRepository extends JpaRepository<LoyaltyPoints, Long> {

    /**
     * Find the loyalty ledger for a specific customer (read-only, no lock).
     * Safe for display queries where no mutation follows.
     *
     * @param userId the customer's user ID
     * @return Optional containing the ledger, or empty if never yet created
     */
    Optional<LoyaltyPoints> findByCustomerId(Long userId);

    /**
     * Find the loyalty ledger for a specific customer with a pessimistic write lock.
     * Use this inside any read-modify-write transaction (e.g. awarding points) to
     * prevent lost-update races when two orders are placed concurrently for the
     * same customer. Consistent with {@code ProductRepository.findByIdWithLock}.
     *
     * @param userId the customer's user ID
     * @return Optional containing the locked ledger row
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT lp FROM LoyaltyPoints lp WHERE lp.customer.id = :userId")
    Optional<LoyaltyPoints> findByCustomerIdWithLock(@Param("userId") Long userId);
}
