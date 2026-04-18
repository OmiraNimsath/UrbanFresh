package com.urbanfresh.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.response.LoyaltyPointsResponse;
import com.urbanfresh.exception.InsufficientLoyaltyPointsException;
import com.urbanfresh.exception.UserNotFoundException;
import com.urbanfresh.model.LoyaltyPoints;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.LoyaltyPointsRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.LoyaltyService;

import lombok.RequiredArgsConstructor;

/**
 * Service Layer – Implements loyalty points awarding and retrieval.
 * Conversion rule: 1 point per every full LKR 100 spent on an order.
 * Ledger row is lazily created on the first order placed by a customer.
 */
@Service
@RequiredArgsConstructor
public class LoyaltyServiceImpl implements LoyaltyService {

    // 1 point is earned for every LKR 100 spent
    private static final int LKR_PER_POINT = 100;

    // 1 redeemed point gives Rs. 5 discount
    private static final int LKR_PER_REDEMPTION_POINT = 5;

    private static final String CONVERSION_RULE =
            "Earn 1 point for every LKR 100 spent. Points can be redeemed in future orders.";

    private final LoyaltyPointsRepository loyaltyPointsRepository;
    private final UserRepository userRepository;

    /**
     * Retrieves the loyalty summary for a customer identified by email.
     * If the customer has never placed an order, returns a zero-balance summary.
     *
     * @param customerEmail email from JWT principal
     * @return LoyaltyPointsResponse with balance, earned, redeemed, and the conversion rule
     */
    @Override
    @Transactional(readOnly = true)
    public LoyaltyPointsResponse getLoyaltyPoints(String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new UserNotFoundException("Customer not found: " + customerEmail));

        LoyaltyPoints ledger = loyaltyPointsRepository
                .findByCustomerId(customer.getId())
                .orElse(emptyLedger(customer));

        return toLoyaltyResponse(ledger);
    }

    /**
     * Credits earned points to the customer's ledger after a successful order.
     * Uses find-or-create so the first-ever order initialises the ledger row.
     * Called within the same @Transactional boundary as order placement.
     *
     * @param customer   the customer to credit
     * @param orderTotal the order total in LKR; integer division gives whole points only
     */
    @Override
    @Transactional
    public void awardPoints(User customer, BigDecimal orderTotal) {
        // Pessimistic write lock prevents a lost-update race when two orders for the same
        // customer are placed concurrently: both would otherwise read the same earnedPoints
        // value, add their points independently, and one write would silently overwrite the other.
        LoyaltyPoints ledger = loyaltyPointsRepository
                .findByCustomerIdWithLock(customer.getId())
                .orElseGet(() -> {
                    // First order — bootstrap a fresh ledger for this customer
                    LoyaltyPoints fresh = LoyaltyPoints.builder()
                            .customer(customer)
                            .build();
                    return loyaltyPointsRepository.save(fresh);
                });

        // Integer division intentional: only whole points are awarded
        int pointsEarned = orderTotal.intValue() / LKR_PER_POINT;
        ledger.setEarnedPoints(ledger.getEarnedPoints() + pointsEarned);
        loyaltyPointsRepository.save(ledger);
    }

    /**
     * Validates a redemption request without touching the ledger.
     * Validates balance and max-discount checks, returns the discount amount
     * without updating redeemedPoints.
     * Called at order placement so the discount is locked into the order total immediately.
     */
    @Override
    @Transactional(readOnly = true)
    public BigDecimal validatePointsRedemption(User customer, int pointsToRedeem, BigDecimal orderTotal) {
        LoyaltyPoints ledger = loyaltyPointsRepository
                .findByCustomerId(customer.getId())
                .orElseThrow(() -> new InsufficientLoyaltyPointsException(
                        "You have no loyalty points available to redeem."));

        int available = ledger.getTotalPoints();
        if (pointsToRedeem > available) {
            throw new InsufficientLoyaltyPointsException(
                    "Insufficient loyalty points. Available: " + available
                    + ", requested: " + pointsToRedeem + ".");
        }

        BigDecimal discount = BigDecimal.valueOf((long) pointsToRedeem * LKR_PER_REDEMPTION_POINT);
        if (discount.compareTo(orderTotal) > 0) {
            int maxRedeemable = orderTotal
                    .divide(BigDecimal.valueOf(LKR_PER_REDEMPTION_POINT), 0, RoundingMode.FLOOR)
                    .intValue();
            throw new InsufficientLoyaltyPointsException(
                    "Redemption discount of Rs. " + discount.toPlainString()
                    + " exceeds the order total. Maximum redeemable: " + maxRedeemable + " points.");
        }

        // No ledger mutation — discount amount is returned for baking into the order total
        return discount;
    }

    /**
     * Deducts already-validated points from the customer's ledger.
     * Must be called only after payment is confirmed (PENDING → CONFIRMED) so points
     * are never permanently consumed for an unpaid order.
     * Uses a pessimistic write lock to prevent concurrent double-deduction.
     */
    @Override
    @Transactional
    public void deductRedeemedPoints(User customer, int pointsToDeduct) {
        if (pointsToDeduct <= 0) {
            return; // nothing to deduct
        }

        LoyaltyPoints ledger = loyaltyPointsRepository
                .findByCustomerIdWithLock(customer.getId())
                .orElseThrow(() -> new InsufficientLoyaltyPointsException(
                        "Loyalty ledger not found for customer — cannot deduct points."));

        ledger.setRedeemedPoints(ledger.getRedeemedPoints() + pointsToDeduct);
        loyaltyPointsRepository.save(ledger);
    }

    /** Build a zero-balance in-memory ledger for a customer with no orders yet (not persisted). */
    private LoyaltyPoints emptyLedger(User customer) {
        return LoyaltyPoints.builder()
                .customer(customer)
                .earnedPoints(0)
                .redeemedPoints(0)
                .build();
    }

    private LoyaltyPointsResponse toLoyaltyResponse(LoyaltyPoints ledger) {
        return LoyaltyPointsResponse.builder()
                .totalPoints(ledger.getTotalPoints())
                .earnedPoints(ledger.getEarnedPoints())
                .redeemedPoints(ledger.getRedeemedPoints())
                .conversionRule(CONVERSION_RULE)
                .build();
    }
}
