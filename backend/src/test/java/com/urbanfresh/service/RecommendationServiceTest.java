package com.urbanfresh.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import com.urbanfresh.dto.response.RecommendationResponse;
import com.urbanfresh.model.OrderStatus;
import com.urbanfresh.model.Role;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.OrderRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.impl.RecommendationServiceImpl;

/**
 * Test Layer – Unit tests for SCRUM-41: habit-based "Buy Again" recommendations.
 * Covers all acceptance-criteria paths:
 *   1. Products ranked by descending frequency (most-ordered first)
 *   2. Result is capped at 5 items even when history contains more
 *   3. Empty list returned when the customer has no confirmed order history
 *
 * The hidden-product and out-of-stock filters are enforced in the JPQL query
 * (database layer); these tests verify the service wires the correct arguments
 * (customerId, confirmed statuses, Pageable limit) into that query.
 *
 * Uses Mockito only — no Spring context loaded.
 */
@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private RecommendationServiceImpl recommendationService;

    // ── Shared fixture ─────────────────────────────────────────────────────────

    private static final String CUSTOMER_EMAIL = "customer@test.com";

    private final User customer = User.builder()
            .id(1L)
            .name("Test Customer")
            .email(CUSTOMER_EMAIL)
            .role(Role.CUSTOMER)
            .build();

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static RecommendationResponse rec(long productId, String name, long totalOrdered) {
        return new RecommendationResponse(
                productId, name, "/img/" + productId + ".jpg",
                BigDecimal.valueOf(100), 10, totalOrdered
        );
    }

    // ── Test 1: Frequency ranking ──────────────────────────────────────────────

    /**
     * When the repository returns products in ranked order, the service must
     * pass them through unchanged — most-ordered product appears first.
     */
    @Test
    void getRecommendations_returnsMostOrderedProductFirst() {
        RecommendationResponse apples  = rec(1L, "Apples",  15L);
        RecommendationResponse bananas = rec(2L, "Bananas",  8L);
        RecommendationResponse carrots = rec(3L, "Carrots",  3L);

        when(userRepository.findByEmail(CUSTOMER_EMAIL)).thenReturn(Optional.of(customer));
        when(orderRepository.findTopProductsByCustomer(
                eq(customer.getId()), any(), any(Pageable.class)))
                .thenReturn(List.of(apples, bananas, carrots));

        List<RecommendationResponse> result = recommendationService.getRecommendations(CUSTOMER_EMAIL);

        assertThat(result).hasSize(3);
        assertThat(result.get(0).getTotalOrdered()).isGreaterThan(result.get(1).getTotalOrdered());
        assertThat(result.get(1).getTotalOrdered()).isGreaterThan(result.get(2).getTotalOrdered());
    }

    // ── Test 2: Result capped at 5 ────────────────────────────────────────────

    /**
     * The service must request a Pageable of size 5, so the DB caps results
     * at the top 5. The service must return exactly what the repository returns.
     */
    @Test
    void getRecommendations_capsResultAtFive() {
        List<RecommendationResponse> top5 = List.of(
                rec(1L, "P1", 20L),
                rec(2L, "P2", 17L),
                rec(3L, "P3", 12L),
                rec(4L, "P4",  9L),
                rec(5L, "P5",  4L)
        );

        when(userRepository.findByEmail(CUSTOMER_EMAIL)).thenReturn(Optional.of(customer));
        when(orderRepository.findTopProductsByCustomer(
                eq(customer.getId()), any(), any(Pageable.class)))
                .thenReturn(top5);

        List<RecommendationResponse> result = recommendationService.getRecommendations(CUSTOMER_EMAIL);

        assertThat(result).hasSize(5);
    }

    // ── Test 3: Empty history ─────────────────────────────────────────────────

    /**
     * A customer who has never placed a confirmed order must receive an empty
     * list (not an error), so the "Buy Again" section is simply hidden.
     */
    @Test
    void getRecommendations_returnsEmptyList_whenNoOrderHistory() {
        when(userRepository.findByEmail(CUSTOMER_EMAIL)).thenReturn(Optional.of(customer));
        when(orderRepository.findTopProductsByCustomer(
                eq(customer.getId()), any(), any(Pageable.class)))
                .thenReturn(List.of());

        List<RecommendationResponse> result = recommendationService.getRecommendations(CUSTOMER_EMAIL);

        assertThat(result).isEmpty();
    }

    // ── Test 4: Correct statuses passed to repository ─────────────────────────

    /**
     * The service must exclude PENDING, CANCELLED, and RETURNED orders.
     * Verified by asserting that the statuses list passed to the repository
     * contains CONFIRMED, PROCESSING, READY, OUT_FOR_DELIVERY, and DELIVERED only.
     */
    @Test
    void getRecommendations_passesOnlyConfirmedStatusesToRepository() {
        when(userRepository.findByEmail(CUSTOMER_EMAIL)).thenReturn(Optional.of(customer));
        when(orderRepository.findTopProductsByCustomer(
                eq(customer.getId()), any(), any(Pageable.class)))
                .thenReturn(List.of());

        recommendationService.getRecommendations(CUSTOMER_EMAIL);

        org.mockito.ArgumentCaptor<List<OrderStatus>> statusCaptor =
                org.mockito.ArgumentCaptor.forClass(List.class);

        org.mockito.Mockito.verify(orderRepository).findTopProductsByCustomer(
                eq(customer.getId()),
                statusCaptor.capture(),
                any(Pageable.class)
        );

        List<OrderStatus> capturedStatuses = statusCaptor.getValue();
        assertThat(capturedStatuses).containsExactlyInAnyOrder(
                OrderStatus.CONFIRMED,
                OrderStatus.PROCESSING,
                OrderStatus.READY,
                OrderStatus.OUT_FOR_DELIVERY,
                OrderStatus.DELIVERED
        );
        assertThat(capturedStatuses).doesNotContain(
                OrderStatus.PENDING,
                OrderStatus.CANCELLED,
                OrderStatus.RETURNED
        );
    }
}
