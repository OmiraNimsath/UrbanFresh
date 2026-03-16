package com.urbanfresh.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.request.OrderItemRequest;
import com.urbanfresh.dto.request.OrderStatusUpdateRequest;
import com.urbanfresh.dto.request.PlaceOrderRequest;
import com.urbanfresh.dto.response.AdminOrderResponse;
import com.urbanfresh.dto.response.AdminOrderReviewResponse;
import com.urbanfresh.dto.response.OrderItemResponse;
import com.urbanfresh.dto.response.OrderResponse;
import com.urbanfresh.exception.InsufficientStockException;
import com.urbanfresh.exception.InvalidOrderStatusTransitionException;
import com.urbanfresh.exception.OrderNotFoundException;
import com.urbanfresh.exception.ProductNotFoundException;
import com.urbanfresh.exception.UserNotFoundException;
import com.urbanfresh.model.Order;
import com.urbanfresh.model.OrderItem;
import com.urbanfresh.model.OrderStatus;
import com.urbanfresh.model.OrderStatusHistory;
import com.urbanfresh.model.PaymentStatus;
import com.urbanfresh.model.Product;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.OrderRepository;
import com.urbanfresh.repository.OrderStatusHistoryRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.LoyaltyService;
import com.urbanfresh.service.OrderService;

import lombok.RequiredArgsConstructor;

/**
 * Service Layer – Implements order placement with transactional stock validation
 * and deduction. Uses pessimistic locking on Product rows to prevent overselling
 * when two customers compete for the last unit.
 */
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

        private static final int MAX_PAGE_SIZE = 100;
		private static final String ADMIN_ALLOWED_STATUS_LABELS = "PROCESSING, READY, CANCELLED";
		private static final String FULL_STATUS_LABELS =
				"PENDING, CONFIRMED, PROCESSING, READY, CANCELLED, OUT_FOR_DELIVERY, DELIVERED, RETURNED";

        		// CONFIRMED is set only by the payment webhook — admins cannot set it directly
		private static final Set<OrderStatus> ADMIN_MANAGEABLE_CURRENT_STATUSES = Set.of(
				OrderStatus.CONFIRMED,   // admin can advance a paid order to PROCESSING
				OrderStatus.PROCESSING,
				OrderStatus.READY,
				OrderStatus.CANCELLED
		);

		private static final Set<OrderStatus> ADMIN_ALLOWED_TARGET_STATUSES = Set.of(
				OrderStatus.PROCESSING,
				OrderStatus.READY,
				OrderStatus.CANCELLED
		);

		private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED_ADMIN_TRANSITIONS = Map.of(
				OrderStatus.CONFIRMED,  Set.of(OrderStatus.PROCESSING, OrderStatus.CANCELLED),
				OrderStatus.PROCESSING, Set.of(OrderStatus.READY, OrderStatus.CANCELLED),
				OrderStatus.READY, Set.of(OrderStatus.PROCESSING),
				OrderStatus.CANCELLED, Set.of(OrderStatus.PROCESSING)
		);

        		private static final Map<OrderStatus, Integer> ORDER_STATUS_PROGRESS_INDEX = Map.of(
				OrderStatus.PENDING, 0,
				OrderStatus.CONFIRMED, 1,   // payment succeeded
				OrderStatus.PROCESSING, 2,
				OrderStatus.READY, 3,
				OrderStatus.OUT_FOR_DELIVERY, 4,
				OrderStatus.DELIVERED, 5,
				OrderStatus.RETURNED, 6,
				OrderStatus.CANCELLED, 7
		);

    private final OrderRepository orderRepository;
        private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final LoyaltyService loyaltyService;

    /**
     * Places an order for the authenticated customer.
     * Steps:
     *  1. Resolve the customer from their email.
     *  2. Lock and load each product row (pessimistic write lock).
     *  3. Validate all stock levels before deducting anything.
     *     If any item fails, the whole order is rejected with a descriptive message.
     *  4. Deduct stock and build OrderItem snapshots.
     *  5. Persist the Order (cascade saves all items).
     *  6. Return the order response.
     *
     * The @Transactional boundary ensures that either every deduction commits
     * together or none do, keeping inventory consistent on failure.
     *
     * @param request       validated payload with delivery address and items
     * @param customerEmail email from the JWT principal
     * @return OrderResponse with the new order ID, status, total, and items
     */
    @Override
    @Transactional
    public OrderResponse placeOrder(PlaceOrderRequest request, String customerEmail) {

        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new UserNotFoundException("Customer not found: " + customerEmail));

        // Phase 1: lock all products and validate stock before touching anything.
        // Collecting all failures at once gives the client a complete picture rather
        // than surfacing one problem at a time.
        List<String> stockErrors = new ArrayList<>();
        List<Product> lockedProducts = new ArrayList<>();

        for (OrderItemRequest item : request.getItems()) {
            Product product = productRepository.findByIdWithLock(item.getProductId())
                    .orElseThrow(() -> new ProductNotFoundException(item.getProductId()));

            if (product.getStockQuantity() < item.getQuantity()) {
                stockErrors.add(String.format(
                        "'%s' — requested %d, available %d",
                        product.getName(), item.getQuantity(), product.getStockQuantity()));
            }

            lockedProducts.add(product);
        }

        // Reject the entire order if any item has insufficient stock
        if (!stockErrors.isEmpty()) {
            throw new InsufficientStockException(
                    "Insufficient stock for: " + String.join("; ", stockErrors));
        }

        // Phase 2: all stock is confirmed — deduct and build line items
        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (int i = 0; i < request.getItems().size(); i++) {
            OrderItemRequest itemRequest = request.getItems().get(i);
            Product product = lockedProducts.get(i);

            // Deduct inventory
            product.setStockQuantity(product.getStockQuantity() - itemRequest.getQuantity());

            BigDecimal lineTotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            total = total.add(lineTotal);

            orderItems.add(OrderItem.builder()
                    .product(product)
                    .productName(product.getName())       // snapshot — survives product edits
                    .unitPrice(product.getPrice())         // snapshot — survives price changes
                    .quantity(itemRequest.getQuantity())
                    .lineTotal(lineTotal)
                    .build());
        }

        // Build the order header and link items to it
        Order order = Order.builder()
                .customer(customer)
                .deliveryAddress(request.getDeliveryAddress())
                .totalAmount(total)
                .status(OrderStatus.PENDING)
                .build();

        // Set the back-reference on each item, then attach to order
        orderItems.forEach(item -> item.setOrder(order));
        order.getItems().addAll(orderItems);

        Order saved = orderRepository.save(order);

        // Award loyalty points after successful order persistence
        loyaltyService.awardPoints(customer, total);

        return toOrderResponse(saved);
    }

    /**
     * Returns all orders for the authenticated customer, newest first.
     * Returns an empty list (not an error) when no orders have been placed.
     *
     * @param customerEmail email from JWT principal
     * @return list of OrderResponse DTOs
     */
    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new UserNotFoundException("Customer not found: " + customerEmail));

        return orderRepository
                .findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(this::toOrderResponse)
                .toList();
    }

        /**
         * Returns a paginated list of all orders for admin order operations.
         * Results are sorted newest first to prioritize operational visibility.
         *
         * @param page zero-based page index
         * @param size requested page size
         * @return page of AdminOrderResponse records
         */
        @Override
        @Transactional(readOnly = true)
        public Page<AdminOrderResponse> getAllOrdersForAdmin(int page, int size) {
                int safePage = Math.max(0, page);
                int safeSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));

                Pageable pageable = PageRequest.of(
                                safePage,
                                safeSize,
                                Sort.by(Sort.Direction.DESC, "createdAt")
                );

                return orderRepository.findAllByOrderByCreatedAtDesc(pageable)
                                .map(this::toAdminOrderResponse);
        }

        /**
         * Returns complete order details for admin review screens.
         *
         * @param orderId target order ID
         * @return detailed admin order response with customer, items, and history
         */
        @Override
        @Transactional(readOnly = true)
        public AdminOrderReviewResponse getOrderReviewForAdmin(Long orderId) {
                Order order = orderRepository.findDetailedById(orderId)
                                .orElseThrow(() -> new OrderNotFoundException(orderId));

                List<OrderStatusHistory> historyRows =
                                orderStatusHistoryRepository.findByOrderIdOrderByChangedAtDesc(orderId);

                return toAdminOrderReviewResponse(order, historyRows);
        }

        /**
         * Updates an order status while enforcing allowed state transitions.
         *
         * @param orderId order ID to update
         * @param request payload containing the target status
         * @param adminEmail authenticated admin email used to populate audit history
         * @return updated AdminOrderResponse
         */
        @Override
        @Transactional
        public AdminOrderResponse updateOrderStatus(Long orderId, OrderStatusUpdateRequest request, String adminEmail) {
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new OrderNotFoundException(orderId));

                User adminUser = userRepository.findByEmail(adminEmail)
                                .orElseThrow(() -> new UserNotFoundException("Admin not found: " + adminEmail));

                OrderStatus targetStatus;
                try {
                        targetStatus = OrderStatus.valueOf(request.getStatus().trim().toUpperCase());
                } catch (IllegalArgumentException ex) {
                        throw new InvalidOrderStatusTransitionException(
                                        "Invalid order status '" + request.getStatus() +
                                                        "'. Allowed values: " + FULL_STATUS_LABELS + "."
                        );
                }

                if (!ADMIN_ALLOWED_TARGET_STATUSES.contains(targetStatus)) {
                        throw new InvalidOrderStatusTransitionException(
                                        "Admins can only set statuses: " + ADMIN_ALLOWED_STATUS_LABELS + "."
                        );
                }

                OrderStatus currentStatus = order.getStatus();
                if (!ADMIN_MANAGEABLE_CURRENT_STATUSES.contains(currentStatus)) {
                        throw new InvalidOrderStatusTransitionException(
                                        "Admin cannot update an order once it reaches " + currentStatus + "."
                        );
                }

                if (currentStatus == targetStatus) {
                        return toAdminOrderResponse(order);
                }

                Set<OrderStatus> allowedTargets = ALLOWED_ADMIN_TRANSITIONS.getOrDefault(currentStatus, Set.of());
                if (!allowedTargets.contains(targetStatus)) {
                        throw new InvalidOrderStatusTransitionException(
                                        "Cannot transition order status from " + currentStatus + " to " + targetStatus + "."
                        );
                }

                String normalizedReason = normalizeChangeReason(request.getChangeReason());
                if (isBackwardTransition(currentStatus, targetStatus) && normalizedReason == null) {
                        throw new InvalidOrderStatusTransitionException(
                                        "Correction reason is required for backward status updates."
                        );
                }

                order.setStatus(targetStatus);
                Order updated = orderRepository.save(order);

                orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                                .order(updated)
                                .previousStatus(currentStatus)
                                .newStatus(targetStatus)
                                .changedByAdmin(adminUser)
                                .changeReason(normalizedReason)
                                .build());

                return toAdminOrderResponse(updated);
        }

        /**
         * Normalizes optional change reason to null when empty.
         *
         * @param changeReason raw reason from request payload
         * @return trimmed reason or null when blank
         */
        private String normalizeChangeReason(String changeReason) {
                if (changeReason == null) {
                        return null;
                }

                String trimmed = changeReason.trim();
                return trimmed.isEmpty() ? null : trimmed;
        }

        /**
         * Determines whether a transition moves backward in the global workflow.
         *
         * @param currentStatus source order status
         * @param targetStatus destination order status
         * @return true when target rank is lower than current rank
         */
        private boolean isBackwardTransition(OrderStatus currentStatus, OrderStatus targetStatus) {
                Integer currentIndex = ORDER_STATUS_PROGRESS_INDEX.get(currentStatus);
                Integer targetIndex = ORDER_STATUS_PROGRESS_INDEX.get(targetStatus);

                if (currentIndex == null || targetIndex == null) {
                        return false;
                }

                return targetIndex < currentIndex;
        }

    /**
     * Maps a persisted Order entity to the API response DTO.
     *
     * @param order the saved order entity
     * @return OrderResponse with all fields populated
     */
    private OrderResponse toOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .lineTotal(item.getLineTotal())
                        .build())
                .toList();

        return OrderResponse.builder()
                .orderId(order.getId())
                .status(order.getStatus().name())
                .deliveryAddress(order.getDeliveryAddress())
                .totalAmount(order.getTotalAmount())
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .build();
    }

        /**
         * Maps an Order entity to the admin order table DTO.
         *
         * @param order persisted order entity
         * @return admin-facing order summary
         */
        private AdminOrderResponse toAdminOrderResponse(Order order) {
                return AdminOrderResponse.builder()
                                .orderId(order.getId())
                                .customerName(order.getCustomer().getName())
                                .orderStatus(order.getStatus().name())
                                .paymentStatus(resolvePersistedPaymentStatus(order))
                                .totalAmount(order.getTotalAmount())
                                .orderDate(order.getCreatedAt())
                                .build();
        }

        /**
         * Maps persisted entities to a detailed admin order review payload.
         *
         * @param order persisted order entity with relations preloaded
         * @param historyRows persisted status history records
         * @return complete admin order review response
         */
        private AdminOrderReviewResponse toAdminOrderReviewResponse(Order order, List<OrderStatusHistory> historyRows) {
                List<AdminOrderReviewResponse.OrderItemInfo> itemRows = order.getItems().stream()
                                .map(item -> AdminOrderReviewResponse.OrderItemInfo.builder()
                                                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                                                .productName(item.getProductName())
                                                .productImage(item.getProduct() != null ? item.getProduct().getImageUrl() : null)
                                                .quantity(item.getQuantity())
                                                .unitPrice(item.getUnitPrice())
                                                .subtotal(item.getLineTotal())
                                                .build())
                                .toList();

                BigDecimal subtotal = itemRows.stream()
                                .map(AdminOrderReviewResponse.OrderItemInfo::getSubtotal)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                // Payment/tax modules are not integrated yet; keep explicit zero values
                // so the review response remains schema-stable for current frontend screens.
                BigDecimal discounts = BigDecimal.ZERO;
                BigDecimal taxes = BigDecimal.ZERO;
                BigDecimal shippingCost = BigDecimal.ZERO;

                List<AdminOrderReviewResponse.StatusHistoryEntry> historyEntries = historyRows.stream()
                                .map(row -> AdminOrderReviewResponse.StatusHistoryEntry.builder()
                                                .previousStatus(row.getPreviousStatus().name())
                                                .newStatus(row.getNewStatus().name())
                                                .changedBy(row.getChangedByAdmin().getName())
                                                .changeReason(row.getChangeReason())
                                                .changedAt(row.getChangedAt())
                                                .build())
                                .toList();

                return AdminOrderReviewResponse.builder()
                                .orderId(order.getId())
                                .orderStatus(order.getStatus().name())
                                .paymentStatus(resolvePersistedPaymentStatus(order))
                                .orderDate(order.getCreatedAt())
                                .lastUpdatedDate(resolveLastUpdatedDate(order, historyRows))
                                .customer(AdminOrderReviewResponse.CustomerInfo.builder()
                                                .customerName(order.getCustomer().getName())
                                                .email(order.getCustomer().getEmail())
                                                .phone(order.getCustomer().getPhone())
                                                .shippingAddress(order.getDeliveryAddress())
                                                .billingAddress(order.getCustomer().getAddress())
                                                .build())
                                .items(itemRows)
                                .pricing(AdminOrderReviewResponse.PricingSummary.builder()
                                                .subtotal(subtotal)
                                                .discounts(discounts)
                                                .taxes(taxes)
                                                .shippingCost(shippingCost)
                                                .finalTotal(order.getTotalAmount())
                                                .build())
                                // Payment details are currently unavailable until payment integration
                                // persists method/reference metadata on orders or a payment ledger.
                                .payment(AdminOrderReviewResponse.PaymentInfo.builder()
                                                .paymentMethod(null)
                                                .paymentStatus(resolvePersistedPaymentStatus(order))
                                                .transactionReference(null)
                                                .build())
                                .statusHistory(historyEntries)
                                .build();
        }

        /**
         * Resolves last update timestamp from status history or creation date fallback.
         *
         * @param order persisted order entity
         * @param historyRows status history records
         * @return last update timestamp for review UI
         */
        private java.time.LocalDateTime resolveLastUpdatedDate(Order order, List<OrderStatusHistory> historyRows) {
                if (!historyRows.isEmpty()) {
                        return historyRows.get(0).getChangedAt();
                }

                return order.getCreatedAt();
        }

        /**
         * Resolves payment status directly from persisted order data.
         * Falls back to PENDING for legacy rows that predate the paymentStatus column.
         *
         * @param order persisted order entity
         * @return payment status label displayed on admin/customer views
         */
        private String resolvePersistedPaymentStatus(Order order) {
                PaymentStatus paymentStatus = order.getPaymentStatus();
                if (paymentStatus == null) {
                        return PaymentStatus.PENDING.name();
                }

                return paymentStatus.name();
        }
}
