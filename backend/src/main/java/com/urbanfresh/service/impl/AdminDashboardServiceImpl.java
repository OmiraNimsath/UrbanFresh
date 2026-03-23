package com.urbanfresh.service.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Service;

import com.urbanfresh.dto.AdminDashboardResponse;
import com.urbanfresh.model.Role;
import com.urbanfresh.repository.OrderRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.UserRepository;
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
    
    @Override
    public AdminDashboardResponse getDashboardMetrics() {
        AdminDashboardResponse response = new AdminDashboardResponse();
        
        // KPI Metrics
        response.setTotalOrders(orderRepository.count());
        response.setTotalRevenue(calculateTotalRevenue());
        response.setActiveSuppliersCount(userRepository.countByRoleAndIsActiveTrue(Role.SUPPLIER));
        response.setTotalProductsCount((int) productRepository.count());
        
        // Alerts remain zero until inventory analytics features are enabled.
        response.setLowStockItemsCount(0);
        response.setNearExpiryItemsCount(0);
        response.setWastePercentage(0.0);
        
        // Summary
        AdminDashboardResponse.DashboardSummary summary = new AdminDashboardResponse.DashboardSummary();
        summary.setLastUpdated(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        summary.setStatusMessage("Dashboard metrics up to date");
        response.setSummary(summary);
        
        return response;
    }
    
    /**
     * Calculate total revenue from all confirmed orders
     * @return sum of totalAmount from CONFIRMED orders
     */
    private double calculateTotalRevenue() {
        // Fetch all confirmed orders and sum their totals
        return orderRepository.findAll().stream()
            .filter(order -> order.getStatus() != null && 
                           "CONFIRMED".equals(order.getStatus().toString()))
            .mapToDouble(order -> order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0)
            .sum();
    }
}
