package com.urbanfresh.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.request.OrderItemRequest;
import com.urbanfresh.dto.request.OrderStatusUpdateRequest;
import com.urbanfresh.dto.request.PlaceOrderRequest;
import com.urbanfresh.dto.response.AdminOrderResponse;
import com.urbanfresh.dto.response.AdminOrderReviewResponse;
import com.urbanfresh.dto.response.DeliveryAssignedOrderResponse;
import com.urbanfresh.dto.response.DeliveryOrderDetailsResponse;
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
import com.urbanfresh.model.Role;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.OrderRepository;
import com.urbanfresh.repository.OrderStatusHistoryRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.LoyaltyService;
import com.urbanfresh.service.NotificationService;
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
                private static final int DELIVERY_ITEMS_SUMMARY_LIMIT = 3;
		private static final String ADMIN_ALLOWED_STATUS_LABELS = "PROCESSING, READY, CANCELLED";
		private static final String FULL_STATUS_LABELS =
				"PENDING, CONFIRMED, PROCESSING, READY, CANCELLED, OUT_FOR_DELIVERY, DELIVERED, RETURNED";
                private static final String DELIVERY_PAYMENT_METHOD_LABEL = "ONLINE (STRIPE)";

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

                private static final Set<OrderStatus> DELIVERY_ALLOWED_CURRENT_STATUSES = Set.of(
                                OrderStatus.OUT_FOR_DELIVERY
                );

                private static final Set<OrderStatus> DELIVERY_ALLOWED_TARGET_STATUSES = Set.of(
                                OrderStatus.DELIVERED,
                                OrderStatus.RETURNED
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
    private final NotificationService notificationService;

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

            // Apply product discount if present, then calculate line total from discounted unit price
            BigDecimal unitPrice = product.getPrice();
            Integer discountPercentage = product.getDiscountPercentage() != null ? product.getDiscountPercentage() : 0;
            BigDecimal discountedUnitPrice = unitPrice;
            
            if (discountPercentage > 0) {
                // discountedUnitPrice = unitPrice * (1 - discount% / 100)
                discountedUnitPrice = unitPrice.multiply(
                    BigDecimal.valueOf(100 - discountPercentage)
                ).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            }

            BigDecimal lineTotal = discountedUnitPrice
                    .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            total = total.add(lineTotal);

            orderItems.add(OrderItem.builder()
                    .product(product)
                    .productName(product.getName())       // snapshot — survives product edits
                    .unitPrice(unitPrice)                  // snapshot of original price — survives edits
                    .productDiscountPercentage(discountPercentage)  // snapshot of discount — preserves calcs
                    .quantity(itemRequest.getQuantity())
                    .lineTotal(lineTotal)
                    .build());
        }

        // Validate loyalty points redemption and lock the discount into the order total.
        // Points are validated here (balance check + max-discount guard) so the customer
        // gets immediate feedback if their balance is insufficient, and the discounted total
        // is persisted on the order. The actual ledger deduction is deferred to
        // PaymentServiceImpl.applyPaidState() — points are only consumed after the Stripe
        // payment is confirmed, so a failed payment never permanently burns a customer's points.
        BigDecimal discount = BigDecimal.ZERO;
        int pointsRedeemed = 0;
        if (request.getPointsToRedeem() > 0) {
            discount = loyaltyService.validatePointsRedemption(customer, request.getPointsToRedeem(), total);
            pointsRedeemed = request.getPointsToRedeem();
            total = total.subtract(discount);
        }

        // Build the order header and link items to it
        Order order = Order.builder()
                .customer(customer)
                .deliveryAddress(request.getDeliveryAddress())
                .totalAmount(total)
                .discountAmount(discount)
                .pointsRedeemed(pointsRedeemed)
                .status(OrderStatus.PENDING)
                .build();

        // Set the back-reference on each item, then attach to order
        orderItems.forEach(item -> item.setOrder(order));
        order.getItems().addAll(orderItems);

        Order saved = orderRepository.save(order);

        // Loyalty points are awarded only after payment is confirmed (PENDING → CONFIRMED).
        // See PaymentServiceImpl.applyPaidState() for the award trigger.

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
     * Returns one order for the authenticated customer by ID.
     * Enforces ownership and does not expose other customers' order details.
     *
     * @param orderId order ID requested by the customer
     * @param customerEmail email from JWT principal
     * @return customer-owned order response
     */
    @Override
    @Transactional(readOnly = true)
    public OrderResponse getMyOrderById(Long orderId, String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new UserNotFoundException("Customer not found: " + customerEmail));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new AccessDeniedException("You are not allowed to view this order.");
        }

        Order detailedOrder = orderRepository.findDetailedByIdAndCustomerId(orderId, customer.getId())
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        return toOrderResponse(detailedOrder);
    }

        /**
         * Returns delivery details for an order assigned to the authenticated
         * delivery person. Denies access when assignment does not match.
         *
         * @param orderId order ID requested by delivery personnel
         * @param deliveryEmail email from JWT principal
         * @return delivery-focused order details payload
         */
        @Override
        @Transactional(readOnly = true)
        public DeliveryOrderDetailsResponse getAssignedOrderDetailsForDelivery(Long orderId, String deliveryEmail) {
                User deliveryPerson = userRepository.findByEmailAndRoleAndIsActiveTrue(deliveryEmail, Role.DELIVERY)
                                .orElseThrow(() -> new UserNotFoundException("Delivery personnel not found: " + deliveryEmail));

                Order baseOrder = orderRepository.findById(orderId)
                        .orElseThrow(() -> new OrderNotFoundException(orderId));

                User assignedDeliveryPerson = baseOrder.getAssignedDeliveryPerson();
                if (assignedDeliveryPerson == null || !assignedDeliveryPerson.getId().equals(deliveryPerson.getId())) {
                        throw new AccessDeniedException("You are not allowed to view this order.");
                }

                Order order = orderRepository
                        .findDetailedByIdAndAssignedDeliveryPersonId(orderId, deliveryPerson.getId())
                        .orElseThrow(() -> new AccessDeniedException("You are not allowed to view this order."));

                return toDeliveryOrderDetailsResponse(order);
        }

                /**
                 * Updates status for an order assigned to the authenticated delivery user.
                 * Allowed transitions are limited to OUT_FOR_DELIVERY -> DELIVERED/RETURNED.
                 *
                 * @param orderId order ID requested by delivery personnel
                 * @param request validated delivery status update payload
                 * @param deliveryEmail email from JWT principal
                 * @return updated delivery-focused order details payload
                 */
                @Override
                @Transactional
                public DeliveryOrderDetailsResponse updateAssignedOrderStatusForDelivery(
                                Long orderId,
                                OrderStatusUpdateRequest request,
                                String deliveryEmail
                ) {
                                User deliveryPerson = userRepository.findByEmailAndRoleAndIsActiveTrue(deliveryEmail, Role.DELIVERY)
                                                .orElseThrow(() -> new UserNotFoundException("Delivery personnel not found: " + deliveryEmail));

                                Order order = orderRepository.findById(orderId)
                                                .orElseThrow(() -> new OrderNotFoundException(orderId));

                                User assignedDeliveryPerson = order.getAssignedDeliveryPerson();
                                if (assignedDeliveryPerson == null || !assignedDeliveryPerson.getId().equals(deliveryPerson.getId())) {
                                                throw new AccessDeniedException("You are not allowed to update this order.");
                                }

                                OrderStatus targetStatus;
                                String requestedStatus = request.getStatus();
                                if (requestedStatus == null || requestedStatus.isBlank()) {
                                                throw new InvalidOrderStatusTransitionException("status is required.");
                                }
                                try {
                                                targetStatus = OrderStatus.valueOf(requestedStatus.trim().toUpperCase());
                                } catch (IllegalArgumentException ex) {
                                                throw new InvalidOrderStatusTransitionException(
                                                                "Invalid order status '" + requestedStatus +
                                                                "'. Allowed values: " + FULL_STATUS_LABELS + "."
                                                );
                                }

                                if (!DELIVERY_ALLOWED_TARGET_STATUSES.contains(targetStatus)) {
                                                throw new InvalidOrderStatusTransitionException(
                                                                "Delivery personnel can only set statuses: DELIVERED, RETURNED."
                                                );
                                }

                                OrderStatus currentStatus = order.getStatus();
                                if (!DELIVERY_ALLOWED_CURRENT_STATUSES.contains(currentStatus)) {
                                                throw new InvalidOrderStatusTransitionException(
                                                                "Delivery status can only be updated when order is OUT_FOR_DELIVERY. Current status: "
                                                                                + currentStatus + "."
                                                );
                                }

                                if (currentStatus == targetStatus) {
                                                Order detailedOrder = orderRepository
                                                                .findDetailedByIdAndAssignedDeliveryPersonId(orderId, deliveryPerson.getId())
                                                                .orElse(order);
                                                return toDeliveryOrderDetailsResponse(detailedOrder);
                                }

                                order.setStatus(targetStatus);
                                Order updated = orderRepository.save(order);

                                orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                                                .order(updated)
                                                .previousStatus(currentStatus)
                                                .newStatus(targetStatus)
                                                .changedByDelivery(deliveryPerson)
                                                .changeReason(normalizeChangeReason(request.getChangeReason()))
                                                .build());

                                notificationService.createOrderStatusNotification(updated, targetStatus);

                                Order detailedUpdatedOrder = orderRepository
                                                .findDetailedByIdAndAssignedDeliveryPersonId(orderId, deliveryPerson.getId())
                                                .orElse(updated);

                                return toDeliveryOrderDetailsResponse(detailedUpdatedOrder);
                }

        /**
         * Returns paginated orders assigned to the authenticated delivery user.
         *
         * @param deliveryEmail email from JWT principal
         * @param page zero-based page index
         * @param size requested page size
         * @return page of delivery dashboard cards
         */
        @Override
        @Transactional(readOnly = true)
        public Page<DeliveryAssignedOrderResponse> getAssignedOrdersForDelivery(String deliveryEmail, int page, int size) {
                User deliveryPerson = userRepository.findByEmailAndRoleAndIsActiveTrue(deliveryEmail, Role.DELIVERY)
                                .orElseThrow(() -> new UserNotFoundException("Delivery personnel not found: " + deliveryEmail));

                int safePage = Math.max(0, page);
                int safeSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));

                Pageable pageable = PageRequest.of(
                                safePage,
                                safeSize,
                                Sort.by(Sort.Direction.DESC, "createdAt")
                );

                Page<Order> assignedOrdersPage = orderRepository
                                .findByAssignedDeliveryPersonIdOrderByCreatedAtDesc(deliveryPerson.getId(), pageable);

                Map<Long, java.time.LocalDateTime> finalStatusTimesByOrderId =
                                resolveFinalStatusTimesByOrderId(assignedOrdersPage.getContent());

                List<DeliveryAssignedOrderResponse> rows = assignedOrdersPage.getContent().stream()
                                .map(order -> toDeliveryAssignedOrderResponse(
                                                order,
                                                finalStatusTimesByOrderId.get(order.getId())
                                ))
                                .toList();

                return new PageImpl<>(rows, pageable, assignedOrdersPage.getTotalElements());
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

                notificationService.createOrderStatusNotification(updated, targetStatus);

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
        List<OrderItemResponse> itemResponses = toOrderItemResponses(order);

        return OrderResponse.builder()
                .orderId(order.getId())
                .status(order.getStatus().name())
                .paymentStatus(resolvePersistedPaymentStatus(order))
                .deliveryAddress(order.getDeliveryAddress())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .pointsRedeemed(order.getPointsRedeemed())
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .build();
    }

    /**
     * Maps order items into immutable response rows.
     *
     * @param order source order entity
     * @return list of response item DTOs
     */
    private List<OrderItemResponse> toOrderItemResponses(Order order) {
        return order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .unitPrice(item.getUnitPrice())
                        .productDiscountPercentage(item.getProductDiscountPercentage())
                        .quantity(item.getQuantity())
                        .lineTotal(item.getLineTotal())
                        .build())
                .toList();
    }

        /**
         * Maps an assigned order to a delivery dashboard card DTO.
         *
         * @param order assigned order entity with customer and items preloaded
         * @return compact delivery dashboard row
         */
        private DeliveryAssignedOrderResponse toDeliveryAssignedOrderResponse(
                        Order order,
                        java.time.LocalDateTime finalStatusAt
        ) {
                String fullAddress = order.getDeliveryAddress();

                return DeliveryAssignedOrderResponse.builder()
                                .orderId(order.getId())
                                .customerName(order.getCustomer() != null ? order.getCustomer().getName() : null)
                                .customerPhone(order.getCustomer() != null ? order.getCustomer().getPhone() : null)
                                .shortDeliveryAddress(toShortAddress(fullAddress))
                                .fullDeliveryAddress(fullAddress)
                                .status(order.getStatus().name())
                                .itemCount(order.getItems() != null ? order.getItems().size() : 0)
                                .itemsSummary(toItemsSummary(order))
                                .totalAmount(order.getTotalAmount())
                                .discountAmount(order.getDiscountAmount())
                                .pointsRedeemed(order.getPointsRedeemed())
                                .paymentStatus(resolvePersistedPaymentStatus(order))
                                .paymentMethod(resolveDeliveryPaymentMethod())
                                .createdAt(order.getCreatedAt())
                                .finalStatusAt(finalStatusAt)
                                .build();
        }

        /**
         * Resolves latest terminal status timestamps for delivered/returned orders.
         *
         * @param orders orders in the current assigned-deliveries page
         * @return map of orderId to terminal status timestamp
         */
        private Map<Long, java.time.LocalDateTime> resolveFinalStatusTimesByOrderId(List<Order> orders) {
                if (orders == null || orders.isEmpty()) {
                        return Map.of();
                }

                List<Long> targetOrderIds = orders.stream()
                                .filter(order -> order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.RETURNED)
                                .map(Order::getId)
                                .toList();

                if (targetOrderIds.isEmpty()) {
                        return Map.of();
                }

                List<OrderStatusHistory> historyRows = orderStatusHistoryRepository
                                .findByOrderIdInAndNewStatusInOrderByChangedAtDesc(
                                                targetOrderIds,
                                                List.of(OrderStatus.DELIVERED, OrderStatus.RETURNED)
                                );

                Map<Long, java.time.LocalDateTime> resolved = new HashMap<>();
                for (OrderStatusHistory row : historyRows) {
                        Long orderId = row.getOrder() != null ? row.getOrder().getId() : null;
                        if (orderId == null || resolved.containsKey(orderId)) {
                                continue;
                        }

                        resolved.put(orderId, row.getChangedAt());
                }

                return resolved;
        }

        /**
         * Produces a concise address preview suitable for list cards.
         *
         * @param address full delivery address
         * @return shortened preview or original value when already short
         */
        private String toShortAddress(String address) {
                if (address == null) {
                        return null;
                }

                String normalized = address.trim();
                if (normalized.length() <= 48) {
                        return normalized;
                }

                return normalized.substring(0, 48).trim() + "...";
        }

        /**
         * Builds a compact item summary string for delivery dashboard cards.
         *
         * @param order source order entity with items
         * @return summary such as "Rice, Milk +2 more"
         */
        private String toItemsSummary(Order order) {
                List<OrderItem> items = order.getItems();
                if (items == null || items.isEmpty()) {
                        return "No items";
                }

                List<String> names = items.stream()
                                .map(OrderItem::getProductName)
                                .filter(name -> name != null && !name.isBlank())
                                .limit(DELIVERY_ITEMS_SUMMARY_LIMIT)
                                .toList();

                if (names.isEmpty()) {
                        return items.size() + " item(s)";
                }

                int hiddenCount = items.size() - names.size();
                if (hiddenCount > 0) {
                        return String.join(", ", names) + " +" + hiddenCount + " more";
                }

                return String.join(", ", names);
        }

        /**
         * Maps an Order entity to the admin order table DTO.
         *
         * @param order persisted order entity
         * @return admin-facing order summary
         */
        private AdminOrderResponse toAdminOrderResponse(Order order) {
                User deliveryPerson = order.getAssignedDeliveryPerson();
                return AdminOrderResponse.builder()
                                .orderId(order.getId())
                                .customerName(order.getCustomer().getName())
                                .orderStatus(order.getStatus().name())
                                .paymentStatus(resolvePersistedPaymentStatus(order))
                                .totalAmount(order.getTotalAmount())
                                .discountAmount(order.getDiscountAmount())
                                .pointsRedeemed(order.getPointsRedeemed())
                                .orderDate(order.getCreatedAt())
                                .deliveryPersonId(deliveryPerson != null ? deliveryPerson.getId() : null)
                                .deliveryPersonName(deliveryPerson != null ? deliveryPerson.getName() : null)
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
                User deliveryPerson = order.getAssignedDeliveryPerson();
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
                BigDecimal discounts = order.getDiscountAmount();
                BigDecimal taxes = BigDecimal.ZERO;
                BigDecimal shippingCost = BigDecimal.ZERO;

                List<AdminOrderReviewResponse.StatusHistoryEntry> historyEntries = historyRows.stream()
                                .map(row -> AdminOrderReviewResponse.StatusHistoryEntry.builder()
                                                .previousStatus(row.getPreviousStatus().name())
                                                .newStatus(row.getNewStatus().name())
                                                .changedBy(resolveStatusChangedByName(row))
                                                .changeReason(row.getChangeReason())
                                                .changedAt(row.getChangedAt())
                                                .build())
                                .toList();

                return AdminOrderReviewResponse.builder()
                                .orderId(order.getId())
                                .orderStatus(order.getStatus().name())
                                .paymentStatus(resolvePersistedPaymentStatus(order))
                                .deliveryPersonId(deliveryPerson != null ? deliveryPerson.getId() : null)
                                .deliveryPersonName(deliveryPerson != null ? deliveryPerson.getName() : null)
                                .orderDate(order.getCreatedAt())
                                .pointsRedeemed(order.getPointsRedeemed())
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

                /**
                 * Resolves the actor name responsible for a status change row.
                 *
                 * @param row status history record
                 * @return actor display name
                 */
                private String resolveStatusChangedByName(OrderStatusHistory row) {
                                if (row.getChangedByAdmin() != null) {
                                                return row.getChangedByAdmin().getName();
                                }

                                if (row.getChangedByDelivery() != null) {
                                                return row.getChangedByDelivery().getName();
                                }

                                return "System";
                }

                /**
                 * Maps an assigned order entity to delivery order details response.
                 *
                 * @param order order entity
                 * @return delivery order details response
                 */
                private DeliveryOrderDetailsResponse toDeliveryOrderDetailsResponse(Order order) {
                                return DeliveryOrderDetailsResponse.builder()
                                                .orderId(order.getId())
                                                .status(order.getStatus().name())
                                                .customerName(order.getCustomer() != null ? order.getCustomer().getName() : null)
                                                .customerPhone(order.getCustomer() != null ? order.getCustomer().getPhone() : null)
                                                .deliveryAddress(order.getDeliveryAddress())
                                                .totalAmount(order.getTotalAmount())
                                                .discountAmount(order.getDiscountAmount())
                                                .pointsRedeemed(order.getPointsRedeemed())
                                                .paymentStatus(resolvePersistedPaymentStatus(order))
                                                .paymentMethod(resolveDeliveryPaymentMethod())
                                                .items(toOrderItemResponses(order))
                                                .build();
                }

                /**
                 * Resolves payment method label for delivery-facing responses.
                 *
                 * @return payment method label used in delivery UI
                 */
                private String resolveDeliveryPaymentMethod() {
                                return DELIVERY_PAYMENT_METHOD_LABEL;
                }

        /**
         * Assigns or reassigns an active delivery person.
         * READY orders are moved to OUT_FOR_DELIVERY, while OUT_FOR_DELIVERY
         * orders keep the same status and only the assignee is updated.
         *
         * @param orderId          ID of the order to assign
         * @param deliveryPersonId ID of the active DELIVERY role user
         * @param adminEmail       authenticated admin email for audit trail
         * @return updated AdminOrderResponse with delivery person info
         */
        @Override
        @Transactional
        public AdminOrderResponse assignDeliveryPersonnel(Long orderId, Long deliveryPersonId, String adminEmail) {
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new OrderNotFoundException(orderId));

                if (order.getStatus() != OrderStatus.READY && order.getStatus() != OrderStatus.OUT_FOR_DELIVERY) {
                        throw new InvalidOrderStatusTransitionException(
                                        "Delivery can only be assigned to orders in READY or OUT_FOR_DELIVERY status. Current status: " + order.getStatus() + "."
                        );
                }

                User deliveryPerson = userRepository.findByIdAndRole(deliveryPersonId, com.urbanfresh.model.Role.DELIVERY)
                                .orElseThrow(() -> new UserNotFoundException(
                                        "Active delivery personnel not found with ID: " + deliveryPersonId));

                if (!Boolean.TRUE.equals(deliveryPerson.getIsActive())) {
                        throw new InvalidOrderStatusTransitionException(
                                        "Cannot assign an inactive delivery person (ID: " + deliveryPersonId + ")."
                        );
                }

                User adminUser = userRepository.findByEmail(adminEmail)
                                .orElseThrow(() -> new UserNotFoundException("Admin not found: " + adminEmail));

                OrderStatus previousStatus = order.getStatus();
                order.setAssignedDeliveryPerson(deliveryPerson);
                if (previousStatus == OrderStatus.READY) {
                        order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
                }
                Order updated = orderRepository.save(order);

                orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                                .order(updated)
                                .previousStatus(previousStatus)
                                .newStatus(updated.getStatus())
                                .changedByAdmin(adminUser)
                                .changeReason("Assigned to delivery personnel: " + deliveryPerson.getName())
                                .build());

                // Only notify when the status actually changed (READY → OUT_FOR_DELIVERY)
                if (updated.getStatus() != previousStatus) {
                        notificationService.createOrderStatusNotification(updated, updated.getStatus());
                }

                return toAdminOrderResponse(updated);
        }
}
