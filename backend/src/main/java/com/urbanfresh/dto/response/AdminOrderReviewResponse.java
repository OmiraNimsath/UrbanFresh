package com.urbanfresh.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Detailed admin order review response.
 * Carries all data required to inspect a single order in the admin panel.
 */
@Getter
@Builder
public class AdminOrderReviewResponse {

    private Long orderId;
    private String orderStatus;
    private String paymentStatus;
    private Long deliveryPersonId;
    private String deliveryPersonName;
    private LocalDateTime orderDate;
    private LocalDateTime lastUpdatedDate;
    private CustomerInfo customer;
    private List<OrderItemInfo> items;
    private PricingSummary pricing;
    private PaymentInfo payment;
    private List<StatusHistoryEntry> statusHistory;

    /**
     * DTO Layer – Customer section for admin order review.
     */
    @Getter
    @Builder
    public static class CustomerInfo {
        private String customerName;
        private String email;
        private String phone;
        private String shippingAddress;
        private String billingAddress;
    }

    /**
     * DTO Layer – Item row section for admin order review.
     */
    @Getter
    @Builder
    public static class OrderItemInfo {
        private Long productId;
        private String productName;
        private String productImage;
        private int quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
    }

    /**
     * DTO Layer – Pricing summary section for admin order review.
     */
    @Getter
    @Builder
    public static class PricingSummary {
        private BigDecimal subtotal;
        private BigDecimal discounts;
        private BigDecimal taxes;
        private BigDecimal shippingCost;
        private BigDecimal finalTotal;
    }

    /**
     * DTO Layer – Payment section for admin order review.
     */
    @Getter
    @Builder
    public static class PaymentInfo {
        private String paymentMethod;
        private String paymentStatus;
        private String transactionReference;
    }

    /**
     * DTO Layer – Status history row for admin order review.
     */
    @Getter
    @Builder
    public static class StatusHistoryEntry {
        private String previousStatus;
        private String newStatus;
        private String changedBy;
        private String changeReason;
        private LocalDateTime changedAt;
    }
}
