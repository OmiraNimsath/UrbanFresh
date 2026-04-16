package com.urbanfresh.service.impl;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.response.RecommendationResponse;
import com.urbanfresh.exception.UserNotFoundException;
import com.urbanfresh.model.OrderStatus;
import com.urbanfresh.repository.OrderRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.RecommendationService;

import lombok.RequiredArgsConstructor;

/**
 * Service Layer – Implements habit-based recommendations.
 * Queries confirmed order history to rank products by purchase frequency,
 * then filters to only those currently in stock and visible to customers.
 */
@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private static final int MAX_RECOMMENDATIONS = 5;

    /** Only orders that represent a real purchase (not cancelled/returned/pending). */
    private static final List<OrderStatus> CONFIRMED_STATUSES = List.of(
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.READY,
            OrderStatus.OUT_FOR_DELIVERY,
            OrderStatus.DELIVERED
    );

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    /**
     * Returns up to 5 most-frequently-purchased products for the customer,
     * ranked by total units ordered. Hidden and out-of-stock products are excluded.
     *
     * @param customerEmail email from JWT principal
     * @return ordered recommendation list (empty when customer has no confirmed orders)
     */
    @Override
    @Transactional(readOnly = true)
    public List<RecommendationResponse> getRecommendations(String customerEmail) {
        Long customerId = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new UserNotFoundException("Customer not found: " + customerEmail))
                .getId();

        return orderRepository.findTopProductsByCustomer(
                customerId,
                CONFIRMED_STATUSES,
                PageRequest.of(0, MAX_RECOMMENDATIONS)
        );
    }
}
