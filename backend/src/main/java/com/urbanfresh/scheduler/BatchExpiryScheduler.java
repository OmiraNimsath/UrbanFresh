package com.urbanfresh.scheduler;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.model.BatchStatus;
import com.urbanfresh.model.Product;
import com.urbanfresh.model.ProductBatch;
import com.urbanfresh.model.WasteRecord;
import com.urbanfresh.repository.ProductBatchRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.WasteRecordRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Scheduler – runs daily at midnight and once on startup to keep batch statuses
 * and product stock quantities in sync with calendar expiry.
 *
 * Two jobs are performed in order each run:
 *  1. Expire overdue batches — any ACTIVE/NEAR_EXPIRY batch whose expiryDate is
 *     before today has its remainingQuantity deducted from the parent product's
 *     stockQuantity and is marked EXPIRED with availableQuantity = 0.
 *  2. Mark near-expiry batches — ACTIVE batches expiring within 7 days are
 *     promoted to NEAR_EXPIRY so the admin dashboard highlights them.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BatchExpiryScheduler {

    /** Window used to flag batches as NEAR_EXPIRY (matches the urgent dashboard bucket). */
    private static final int NEAR_EXPIRY_WINDOW_DAYS = 7;

    private final ProductBatchRepository productBatchRepository;
    private final ProductRepository productRepository;
    private final WasteRecordRepository wasteRecordRepository;

    /**
     * Scheduled entry point — runs at midnight every day.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void runDailyExpiryUpdate() {
        LocalDate today = LocalDate.now();
        log.info("[BatchExpiryScheduler] Running expiry update for date={}", today);
        expireDateExpiredBatches(today);
        markNearExpiryBatches(today);
    }

    /**
     * Startup hook — runs once after the application context is fully ready
     * so that batches that expired while the app was offline are caught immediately.
     * Kept separate from the @Scheduled method to prevent double-fire on startup.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void runExpiryUpdateOnStartup() {
        LocalDate today = LocalDate.now();
        log.info("[BatchExpiryScheduler] Running startup expiry update for date={}", today);
        expireDateExpiredBatches(today);
        markNearExpiryBatches(today);
    }

    /**
     * Finds every ACTIVE/NEAR_EXPIRY batch whose expiryDate is before today,
     * deducts its remaining availableQuantity from the parent product's stockQuantity,
     * zeros out availableQuantity, and transitions the batch to EXPIRED.
     */
    private void expireDateExpiredBatches(LocalDate today) {
        List<ProductBatch> overdue = productBatchRepository.findBatchesForExpiredTransition(today);

        if (overdue.isEmpty()) {
            log.debug("[BatchExpiryScheduler] No overdue batches found.");
            return;
        }

        log.info("[BatchExpiryScheduler] Expiring {} overdue batch(es).", overdue.size());

        for (ProductBatch batch : overdue) {
            int remaining = batch.getAvailableQuantity();
            Product product = batch.getProduct();

            if (remaining > 0) {
                // Record the waste event BEFORE zeroing stock so the report can see it
                if (!wasteRecordRepository.existsByBatchId(batch.getId())) {
                    BigDecimal wastedValue = product.getPrice()
                            .multiply(BigDecimal.valueOf(remaining));
                    wasteRecordRepository.save(WasteRecord.builder()
                            .product(product)
                            .batch(batch)
                            .wastedQuantity(remaining)
                            .pricePerUnit(product.getPrice())
                            .wastedValue(wastedValue)
                            .expiryDate(batch.getExpiryDate())
                            .build());
                }

                int newStock = Math.max(0, product.getStockQuantity() - remaining);
                log.info("[BatchExpiryScheduler] Batch {} (product={}) — deducting {} units, stock: {} → {}",
                        batch.getBatchNumber(), product.getName(), remaining,
                        product.getStockQuantity(), newStock);
                product.setStockQuantity(newStock);
                productRepository.save(product);
            }

            batch.setAvailableQuantity(0);
            batch.setStatus(BatchStatus.EXPIRED);
            productBatchRepository.save(batch);
        }
    }

    /**
     * Transitions ACTIVE batches whose expiryDate falls within the next
     * NEAR_EXPIRY_WINDOW_DAYS days to NEAR_EXPIRY status.
     */
    private void markNearExpiryBatches(LocalDate today) {
        LocalDate cutoff = today.plusDays(NEAR_EXPIRY_WINDOW_DAYS);
        List<ProductBatch> nearExpiry = productBatchRepository
                .findBatchesForNearExpiryTransition(today, cutoff);

        if (!nearExpiry.isEmpty()) {
            log.info("[BatchExpiryScheduler] Marking {} batch(es) as NEAR_EXPIRY.", nearExpiry.size());
            for (ProductBatch batch : nearExpiry) {
                batch.setStatus(BatchStatus.NEAR_EXPIRY);
                productBatchRepository.save(batch);
            }
        }
    }
}
