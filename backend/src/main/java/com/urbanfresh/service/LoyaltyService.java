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

    /**
     * Redeem loyalty points for a discount on an order.
     * Conversion rule: 1 point = Rs. 5 discount.
     * Uses a pessimistic write lock to prevent concurrent double-redemption.
     *
     * @param customer       the customer redeeming points
     * @param pointsToRedeem number of points the customer wants to apply (must be > 0)
     * @param orderTotal     the order total before discount; discount cannot exceed this
     * @return the discount amount in LKR to subtract from the order total
     * @throws InsufficientLoyaltyPointsException if balance is insufficient or discount exceeds order total
     */
    BigDecimal redeemPoints(User customer, int pointsToRedeem, BigDecimal orderTotal);

    /**
     * Validates that the customer has enough loyalty points to redeem and that the
     * computed discount does not exceed the order total — WITHOUT deducting from the ledger.
     * Call this at order placement so the amount is baked into the order total immediately,
     * then call {@link #deductRedeemedPoints(User, int)} after payment is confirmed to
     * actually update the ledger.
     *
     * @param customer       the customer attempting to redeem
     * @param pointsToRedeem number of points to validate (must be &gt; 0)
     * @param orderTotal     pre-discount order total; discount must not exceed this
     * @return the discount amount (pointsToRedeem × Rs. 5) that will be applied
     * @throws InsufficientLoyaltyPointsException if balance is insufficient or discount exceeds order total
     */
    BigDecimal validatePointsRedemption(User customer, int pointsToRedeem, BigDecimal orderTotal);

    /**
     * Deducts redeemed points from the customer's ledger.
     * Must only be called AFTER payment is confirmed (order status → CONFIRMED).
     * Uses a pessimistic write lock to prevent concurrent double-deduction.
     *
     * @param customer       the customer whose ledger to debit
     * @param pointsToDeduct number of points to deduct (as stored on the order)
     */
    void deductRedeemedPoints(User customer, int pointsToDeduct);
}
