package com.urbanfresh.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.urbanfresh.model.WasteRecord;

/**
 * Repository Layer – Spring Data JPA repository for WasteRecord entities.
 */
@Repository
public interface WasteRecordRepository extends JpaRepository<WasteRecord, Long> {

    /** Returns all waste records ordered by expiry date ascending for report generation. */
    List<WasteRecord> findAllByOrderByExpiryDateAsc();

    /** Sums the total wasted value across all records. */
    @Query("SELECT COALESCE(SUM(w.wastedValue), 0) FROM WasteRecord w")
    BigDecimal sumTotalWastedValue();

    /** Sums the total wasted units across all records. */
    @Query("SELECT COALESCE(SUM(w.wastedQuantity), 0) FROM WasteRecord w")
    int sumTotalWastedUnits();

    /** Checks whether a waste record already exists for a given batch
     * to prevent duplicate entries if the scheduler runs twice in edge cases.
     */
    boolean existsByBatchId(Long batchId);

    /** Sums wasted value for records whose expiryDate falls within the given month. */
    @Query("SELECT COALESCE(SUM(w.wastedValue), 0) FROM WasteRecord w " +
           "WHERE YEAR(w.expiryDate) = :year AND MONTH(w.expiryDate) = :month")
    BigDecimal sumWastedValueByMonth(@Param("year") int year,
                                     @Param("month") int month);
}
