package com.urbanfresh.model;

/**
 * Domain Layer – Enumeration of lifecycle states for a product batch.
 * Drives filtering logic: only ACTIVE and NEAR_EXPIRY batches are eligible
 * for FIFO order allocation; QUARANTINED and EXPIRED are excluded.
 */
public enum BatchStatus {

    /** Batch received but not yet available for sale (e.g., awaiting quality check). */
    RECEIVED,

    /** Batch is available for sale. Default state after PO confirmation. */
    ACTIVE,

    /** Batch is within the near-expiry window (e.g., ≤ 7 days). Auto-managed by scheduler. */
    NEAR_EXPIRY,

    /** Batch is withheld from sale due to quality concerns. Must be manually set by admin. */
    QUARANTINED,

    /** Batch has passed its expiry date or been fully depleted. */
    EXPIRED
}
