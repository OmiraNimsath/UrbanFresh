package com.urbanfresh.service;

import java.math.BigDecimal;

import com.urbanfresh.dto.response.LoyaltyPointsResponse;
import com.urbanfresh.model.User;

/**
 * Service Layer – Contract for loyalty points operations.
 * Handles awarding points after a successful order and
 * retrieving a customer's current loyalty summary.
 */
public interface LoyaltyService {

    /**
     * Return the loyalty points summary for the authenticated customer.
     *
     * @param customerEmail email from JWT principal
     * @return LoyaltyPointsResponse with balance, earned, redeemed, and rule
     */
    LoyaltyPointsResponse getLoyaltyPoints(String customerEmail);

    /**
     * Award points to a customer after a successful order.
     * Conversion rule: 1 point per every full LKR 100 spent.
     * Creates the ledger row if one does not yet exist for this customer.
     *
     * @param customer   the customer entity to credit
     * @param orderTotal the order's total amount in LKR
     */
    void awardPoints(User customer, BigDecimal orderTotal);
}
