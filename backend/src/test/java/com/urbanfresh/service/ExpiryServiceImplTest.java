package com.urbanfresh.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.urbanfresh.dto.response.ExpiryBucketResponse;
import com.urbanfresh.model.ApprovalStatus;
import com.urbanfresh.model.PricingUnit;
import com.urbanfresh.model.Product;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.ProductBatchRepository;
import com.urbanfresh.service.impl.ExpiryServiceImpl;

/**
 * Test Layer – Unit tests for ExpiryServiceImpl bucket threshold categorisation.
 * Covers every boundary condition for the three urgency buckets:
 *   critical (0–1 days), urgent (2–7 days), warning (8–30 days).
 */
@ExtendWith(MockitoExtension.class)
class ExpiryServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductBatchRepository productBatchRepository;

    @InjectMocks
    private ExpiryServiceImpl expiryService;

    // Captured once per test class load; service also calls LocalDate.now() in the same JVM.
    private final LocalDate today = LocalDate.now();

    // ── Helper ─────────────────────────────────────────────────────────────────

    /**
     * Builds a minimal approved in-stock product expiring on the given date.
     * Using the builder keeps tests concise while remaining readable.
     */
    private Product productExpiringOn(LocalDate expiryDate) {
        return Product.builder()
                .id((long) (Math.random() * 1_000_000))
                .name("Test Product")
                .price(BigDecimal.valueOf(299.99))
                .unit(PricingUnit.PER_ITEM)
                .stockQuantity(10)
                .reorderThreshold(2)
                .approvalStatus(ApprovalStatus.APPROVED)
                .expiryDate(expiryDate)
                .build();
    }

    /**
     * Stubs the repository to return the given list for any date range query.
     * The service always queries [today, today+30]; we capture that via any().
     */
    private void stubRepository(List<Product> products) {
        when(productRepository
                .findByExpiryDateBetweenAndStockQuantityGreaterThanOrderByExpiryDateAsc(
                        any(LocalDate.class), any(LocalDate.class), eq(0)))
                .thenReturn(products);
    }

    // ── Scenario 1: correct bucket placement ───────────────────────────────────

    /**
     * Verifies that a product expiring today (daysUntilExpiry = 0) lands in within1Day.
     */
    @Test
    void getExpiryBuckets_productExpiringToday_isInCriticalBucket() {
        Product expiringToday = productExpiringOn(today);
        stubRepository(List.of(expiringToday));

        ExpiryBucketResponse response = expiryService.getExpiryBuckets();

        assertThat(response.getWithin1Day()).hasSize(1);
        assertThat(response.getWithin1Day().get(0).getDaysUntilExpiry()).isZero();
        assertThat(response.getWithin7Days()).isEmpty();
        assertThat(response.getWithin30Days()).isEmpty();
    }

    /**
     * Verifies that a product expiring tomorrow (daysUntilExpiry = 1) lands in within1Day.
     * Day 1 is the upper boundary of the critical bucket.
     */
    @Test
    void getExpiryBuckets_productExpiringTomorrow_isInCriticalBucket() {
        Product expiringTomorrow = productExpiringOn(today.plusDays(1));
        stubRepository(List.of(expiringTomorrow));

        ExpiryBucketResponse response = expiryService.getExpiryBuckets();

        assertThat(response.getWithin1Day()).hasSize(1);
        assertThat(response.getWithin1Day().get(0).getDaysUntilExpiry()).isEqualTo(1L);
        assertThat(response.getWithin7Days()).isEmpty();
        assertThat(response.getWithin30Days()).isEmpty();
    }

    /**
     * Verifies that a product expiring in 2 days (lower boundary of urgent) is in within7Days.
     */
    @Test
    void getExpiryBuckets_productExpiringInTwoDays_isInUrgentBucket() {
        Product expiringIn2 = productExpiringOn(today.plusDays(2));
        stubRepository(List.of(expiringIn2));

        ExpiryBucketResponse response = expiryService.getExpiryBuckets();

        assertThat(response.getWithin1Day()).isEmpty();
        assertThat(response.getWithin7Days()).hasSize(1);
        assertThat(response.getWithin7Days().get(0).getDaysUntilExpiry()).isEqualTo(2L);
        assertThat(response.getWithin30Days()).isEmpty();
    }

    /**
     * Verifies that a product expiring in 7 days (upper boundary of urgent) is in within7Days.
     */
    @Test
    void getExpiryBuckets_productExpiringInSevenDays_isInUrgentBucket() {
        Product expiringIn7 = productExpiringOn(today.plusDays(7));
        stubRepository(List.of(expiringIn7));

        ExpiryBucketResponse response = expiryService.getExpiryBuckets();

        assertThat(response.getWithin7Days()).hasSize(1);
        assertThat(response.getWithin7Days().get(0).getDaysUntilExpiry()).isEqualTo(7L);
        assertThat(response.getWithin1Day()).isEmpty();
        assertThat(response.getWithin30Days()).isEmpty();
    }

    /**
     * Verifies that a product expiring in 8 days (lower boundary of warning) is in within30Days.
     */
    @Test
    void getExpiryBuckets_productExpiringInEightDays_isInWarningBucket() {
        Product expiringIn8 = productExpiringOn(today.plusDays(8));
        stubRepository(List.of(expiringIn8));

        ExpiryBucketResponse response = expiryService.getExpiryBuckets();

        assertThat(response.getWithin30Days()).hasSize(1);
        assertThat(response.getWithin30Days().get(0).getDaysUntilExpiry()).isEqualTo(8L);
        assertThat(response.getWithin1Day()).isEmpty();
        assertThat(response.getWithin7Days()).isEmpty();
    }

    /**
     * Verifies that a product expiring in 30 days (upper boundary of warning) is in within30Days.
     */
    @Test
    void getExpiryBuckets_productExpiringInThirtyDays_isInWarningBucket() {
        Product expiringIn30 = productExpiringOn(today.plusDays(30));
        stubRepository(List.of(expiringIn30));

        ExpiryBucketResponse response = expiryService.getExpiryBuckets();

        assertThat(response.getWithin30Days()).hasSize(1);
        assertThat(response.getWithin30Days().get(0).getDaysUntilExpiry()).isEqualTo(30L);
        assertThat(response.getWithin1Day()).isEmpty();
        assertThat(response.getWithin7Days()).isEmpty();
    }

    // ── Scenario 2: mixed products land in correct buckets ─────────────────────

    /**
     * Verifies that products spanning all three buckets are partitioned correctly
     * when returned together by the repository.
     */
    @Test
    void getExpiryBuckets_mixedProducts_eachLandsInCorrectBucket() {
        Product critical  = productExpiringOn(today.plusDays(0));
        Product urgent    = productExpiringOn(today.plusDays(5));
        Product warning   = productExpiringOn(today.plusDays(20));

        stubRepository(List.of(critical, urgent, warning));

        ExpiryBucketResponse response = expiryService.getExpiryBuckets();

        assertThat(response.getWithin1Day()).hasSize(1);
        assertThat(response.getWithin7Days()).hasSize(1);
        assertThat(response.getWithin30Days()).hasSize(1);
    }

    // ── Scenario 3: total count ─────────────────────────────────────────────────

    /**
     * Verifies that totalNearExpiryCount equals the sum across all three buckets.
     */
    @Test
    void getExpiryBuckets_totalCountMatchesSumOfAllBuckets() {
        List<Product> allProducts = List.of(
                productExpiringOn(today),              // critical
                productExpiringOn(today.plusDays(1)),  // critical
                productExpiringOn(today.plusDays(4)),  // urgent
                productExpiringOn(today.plusDays(7)),  // urgent
                productExpiringOn(today.plusDays(15)), // warning
                productExpiringOn(today.plusDays(30))  // warning
        );
        stubRepository(allProducts);

        ExpiryBucketResponse response = expiryService.getExpiryBuckets();

        int expectedTotal = response.getWithin1Day().size()
                + response.getWithin7Days().size()
                + response.getWithin30Days().size();

        assertThat(response.getTotalNearExpiryCount()).isEqualTo(expectedTotal);
        assertThat(response.getTotalNearExpiryCount()).isEqualTo(6);
    }

    // ── Scenario 4: empty result ────────────────────────────────────────────────

    /**
     * Verifies that all buckets are empty and total is zero when no near-expiry
     * products exist (repository returns empty list).
     */
    @Test
    void getExpiryBuckets_noNearExpiryProducts_allBucketsEmpty() {
        stubRepository(List.of());

        ExpiryBucketResponse response = expiryService.getExpiryBuckets();

        assertThat(response.getWithin1Day()).isEmpty();
        assertThat(response.getWithin7Days()).isEmpty();
        assertThat(response.getWithin30Days()).isEmpty();
        assertThat(response.getTotalNearExpiryCount()).isZero();
    }

    // ── Scenario 5: daysUntilExpiry field correctness ──────────────────────────

    /**
     * Verifies that the daysUntilExpiry field on the response DTO is correctly
     * computed (not just assigned from the entity) for a product expiring in 5 days.
     */
    @Test
    void getExpiryBuckets_daysUntilExpiryIsComputedCorrectly() {
        Product product = productExpiringOn(today.plusDays(5));
        stubRepository(List.of(product));

        ExpiryBucketResponse response = expiryService.getExpiryBuckets();

        assertThat(response.getWithin7Days()).hasSize(1);
        assertThat(response.getWithin7Days().get(0).getDaysUntilExpiry()).isEqualTo(5L);
    }

    // ── Scenario 6: no overlap between buckets ─────────────────────────────────

    /**
     * Verifies that no product appears in more than one bucket.
     * A product expiring in 1 day must NOT also appear in within7Days or within30Days.
     */
    @Test
    void getExpiryBuckets_bucketsAreNonOverlapping() {
        // Boundary products at 1, 7, and 8 days
        Product boundary1  = productExpiringOn(today.plusDays(1));
        Product boundary7  = productExpiringOn(today.plusDays(7));
        Product boundary8  = productExpiringOn(today.plusDays(8));

        stubRepository(List.of(boundary1, boundary7, boundary8));

        ExpiryBucketResponse response = expiryService.getExpiryBuckets();

        // Each product appears in exactly one bucket
        assertThat(response.getWithin1Day()).hasSize(1);
        assertThat(response.getWithin7Days()).hasSize(1);
        assertThat(response.getWithin30Days()).hasSize(1);
        assertThat(response.getTotalNearExpiryCount()).isEqualTo(3);
    }
}
