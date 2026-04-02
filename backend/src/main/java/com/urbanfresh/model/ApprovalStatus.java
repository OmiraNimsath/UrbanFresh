package com.urbanfresh.model;

/**
 * Domain Layer - Enum representing the approval state of a product.
 * PENDING: Requested by a supplier, awaiting admin approval.
 * APPROVED: Approved by admin, visible in the store.
 * REJECTED: Rejected by admin.
 */
public enum ApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED
}

