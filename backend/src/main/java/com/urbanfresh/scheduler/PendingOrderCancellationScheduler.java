package com.urbanfresh.scheduler;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.urbanfresh.service.OrderService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Scheduler – runs every hour to cancel PENDING orders that are older than 24 hours.
 *
 * PENDING orders are created when a customer initiates checkout but payment is never
 * confirmed (abandoned session, failed card, etc.). Without this job those orders would
 * hold stock indefinitely. Once cancelled the allocated stock is returned to its
 * originating product batches so it becomes available for other customers again.
 *
 * Also runs once on startup so any stale orders from downtime are cleaned up immediately.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PendingOrderCancellationScheduler {

    private final OrderService orderService;

    /**
     * Scheduled entry point — runs at the top of every hour.
     * Also invoked once immediately after startup via ApplicationReadyEvent.
     */
    @Scheduled(cron = "0 0 * * * *")
    @EventListener(ApplicationReadyEvent.class)
    public void cancelStalePendingOrders() {
        log.info("[PendingOrderCancellationScheduler] Checking for stale PENDING orders (>24 h)...");
        orderService.cancelStalePendingOrders();
    }
}
