package com.urbanfresh.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.request.OrderItemRequest;
import com.urbanfresh.dto.request.PlaceOrderRequest;
import com.urbanfresh.dto.response.OrderItemResponse;
import com.urbanfresh.dto.response.OrderResponse;
import com.urbanfresh.exception.InsufficientStockException;
import com.urbanfresh.exception.ProductNotFoundException;
import com.urbanfresh.exception.UserNotFoundException;
import com.urbanfresh.model.Order;
import com.urbanfresh.model.OrderItem;
import com.urbanfresh.model.OrderStatus;
import com.urbanfresh.model.Product;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.OrderRepository;
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

    private final OrderRepository orderRepository;
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
}
