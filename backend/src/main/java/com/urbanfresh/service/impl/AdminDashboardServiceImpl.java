package com.urbanfresh.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Service;

import com.urbanfresh.dto.AdminDashboardResponse;
import com.urbanfresh.model.PaymentStatus;
import com.urbanfresh.model.Role;
import com.urbanfresh.repository.OrderRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.repository.WasteRecordRepository;
import com.urbanfresh.service.AdminDashboardService;

import lombok.RequiredArgsConstructor;

/**
 * Admin Dashboard Service Implementation
 * Layer: Service (Business Logic)
 * Calculates KPI metrics and alert counts from repositories
 */
@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {
    
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final WasteRecordRepository wasteRecordRepository;
    
    @Override
    public AdminDashboardResponse getDashboardMetrics() {
        AdminDashboardResponse response = new AdminDashboardResponse();
        
        // KPI Metrics
        response.setTotalOrders(orderRepository.count());
        response.setTotalRevenue(calculateTotalRevenue());
        response.setActiveSuppliersCount(userRepository.countByRoleAndIsActiveTrue(Role.SUPPLIER));
        response.setTotalProductsCount((int) productRepository.count());
        
        // Low stock: products at or below their reorder threshold
        response.setLowStockItemsCount(countLowStockProducts());
        // Near expiry: in-stock approved products expiring within 7 days
        response.setNearExpiryItemsCount(countNearExpiryProducts());
        // Wasted value this calendar month from the waste_records audit table
        LocalDate now = LocalDate.now();
        BigDecimal wastedThisMonth =
                wasteRecordRepository.sumWastedValueByMonth(now.getYear(), now.getMonthValue());
        response.setWastedValueThisMonth(
                wastedThisMonth != null ? wastedThisMonth : BigDecimal.ZERO);
        
        // Summary
        AdminDashboardResponse.DashboardSummary summary = new AdminDashboardResponse.DashboardSummary();
        summary.setLastUpdated(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        summary.setStatusMessage("Dashboard metrics up to date");
        response.setSummary(summary);
        
        return response;
    }
    
    /**
     * Sums totalAmount across all PAID orders regardless of their current
     * fulfilment status. Orders progress through CONFIRMED → PROCESSING →
     * READY → DELIVERED, so filtering only by order status would cause revenue
     * to shrink as orders are fulfilled.
     *
     * @return total revenue from all paid orders as a double
     */
    private double calculateTotalRevenue() {
        BigDecimal total = orderRepository.sumTotalAmountByPaymentStatus(PaymentStatus.PAID);
        return total != null ? total.doubleValue() : 0.0;
    }

    /**
     * Counts in-stock approved products expiring within the next 7 days.
     * Reuses the existing repository query used by the public near-expiry endpoint.
     */
    private int countNearExpiryProducts() {
        LocalDate today = LocalDate.now();
        LocalDate cutoff = today.plusDays(7);
        return productRepository
                .findByExpiryDateBetweenAndStockQuantityGreaterThanOrderByExpiryDateAsc(today, cutoff, 0)
                .size();
    }

    /**
     * Counts products whose current stock is at or below their reorder threshold.
     * Uses a single COUNT query instead of loading all product rows into memory.
     */
    private int countLowStockProducts() {
        return (int) productRepository.countLowStockProducts();
    }
}
