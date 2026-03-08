package com.urbanfresh.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Loyalty points summary returned to the customer dashboard.
 * Includes the current balance, lifetime earned, redeemed, and the conversion rule
 * so the frontend can display it without hardcoding business logic.
 */
@Getter
@Builder
public class LoyaltyPointsResponse {

    /** Points available to redeem (earned minus redeemed). */
    private int totalPoints;

    /** Lifetime points ever earned across all orders. */
    private int earnedPoints;

    /** Total points already redeemed. */
    private int redeemedPoints;

    /**
     * Human-readable conversion rule shown on the dashboard.
     * Example: "Earn 1 point for every LKR 100 spent. 1 point = LKR 1 value."
     */
    private String conversionRule;
}
