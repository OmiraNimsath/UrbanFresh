package com.urbanfresh.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.urbanfresh.model.ProductBatch;

/**
 * Repository Layer – Spring Data JPA repository for ProductBatch entities.
 * Exposes FIFO-ordered queries for allocation and expiry-driven batch management.
 */
@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {

    /**
     * Returns batches eligible for FIFO allocation: ACTIVE or NEAR_EXPIRY, with
     * available stock, ordered by expiryDate ascending (oldest first).
     *
     * @param productId product ID to query
     * @return ordered list of allocatable batches
     */
    @Query("SELECT b FROM ProductBatch b WHERE b.product.id = :productId " +
           "AND b.status IN ('ACTIVE', 'NEAR_EXPIRY') " +
           "AND b.availableQuantity > 0 " +
           "ORDER BY b.expiryDate ASC")
    List<ProductBatch> findAllocatableBatchesByProductId(@Param("productId") Long productId);

    /**
     * Returns all batches for a product ordered by expiry date ascending.
     * Used by admin views to inspect full batch inventory.
     *
     * @param productId product ID to query
     * @return all batches for the product
     */
    List<ProductBatch> findByProductIdOrderByExpiryDateAsc(Long productId);

    /**
     * Sums available quantities across all allocatable (ACTIVE + NEAR_EXPIRY) batches.
     * Used by ProductService to derive the inStock flag.
     *
     * @param productId product ID to query
     * @return total allocatable units; 0 if no batches exist
     */
    @Query("SELECT COALESCE(SUM(b.availableQuantity), 0) FROM ProductBatch b " +
           "WHERE b.product.id = :productId AND b.status IN ('ACTIVE', 'NEAR_EXPIRY')")
    int sumAvailableQuantityByProductId(@Param("productId") Long productId);

    /**
     * Returns the earliest expiry date across allocatable batches for a product.
     * Surfaces the "expires soonest" date on the public product card.
     *
     * @param productId product ID to query
     * @return optional earliest expiry date; empty if no allocatable batches
     */
    @Query("SELECT MIN(b.expiryDate) FROM ProductBatch b " +
           "WHERE b.product.id = :productId AND b.status IN ('ACTIVE', 'NEAR_EXPIRY') " +
           "AND b.availableQuantity > 0")
    Optional<LocalDate> findEarliestExpiryDateByProductId(@Param("productId") Long productId);

    /**
     * Counts all batches for a product regardless of status.
     * Used to generate an incrementing batch number on delivery confirmation.
     */
    long countByProductId(Long productId);

    /**
     * Finds active batches whose expiry falls between today and the cutoff date.
     * Used by the batch status scheduler to transition ACTIVE → NEAR_EXPIRY.
     */
    @Query("SELECT b FROM ProductBatch b WHERE b.expiryDate BETWEEN :today AND :cutoff " +
           "AND b.status = 'ACTIVE'")
    List<ProductBatch> findBatchesForNearExpiryTransition(
            @Param("today") LocalDate today,
            @Param("cutoff") LocalDate cutoff);

    /**
     * Finds non-expired batches past their expiry date.
     * Used by the batch status scheduler to transition batches → EXPIRED.
     */
    @Query("SELECT b FROM ProductBatch b WHERE b.expiryDate < :today " +
           "AND b.status IN ('ACTIVE', 'NEAR_EXPIRY')")
    List<ProductBatch> findBatchesForExpiredTransition(@Param("today") LocalDate today);

    /**
     * Returns all ACTIVE and NEAR_EXPIRY batches for a product, ordered by expiry date.
     * Used when propagating an expiry-date change — excludes already-EXPIRED batches
     * to preserve waste history integrity.
     *
     * @param productId product ID to query
     * @return live batches ordered by expiry date ASC
     */
    @Query("SELECT b FROM ProductBatch b WHERE b.product.id = :productId " +
           "AND b.status IN ('ACTIVE', 'NEAR_EXPIRY') " +
           "ORDER BY b.expiryDate ASC")
    List<ProductBatch> findActiveBatchesByProductId(@Param("productId") Long productId);
}
