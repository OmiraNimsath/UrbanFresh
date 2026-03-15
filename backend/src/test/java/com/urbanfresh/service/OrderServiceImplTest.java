package com.urbanfresh.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.urbanfresh.dto.request.OrderStatusUpdateRequest;
import com.urbanfresh.dto.response.AdminOrderResponse;
import com.urbanfresh.dto.response.AdminOrderReviewResponse;
import com.urbanfresh.exception.InvalidOrderStatusTransitionException;
import com.urbanfresh.exception.OrderNotFoundException;
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
import com.urbanfresh.service.impl.OrderServiceImpl;

/**
 * Unit tests for admin order operations in OrderServiceImpl.
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LoyaltyService loyaltyService;

    @InjectMocks
    private OrderServiceImpl orderService;

    /**
     * Creates an admin fixture used as the actor for status updates.
     *
     * @return admin user fixture
     */
    private User buildAdminUser() {
        return User.builder()
                .id(99L)
                .name("Alice Admin")
                .email("admin@urbanfresh.test")
                .password("hash")
                .role(Role.ADMIN)
                .build();
    }

    /**
     * Creates a sample order fixture for tests.
     *
     * @param id order ID
     * @param status order lifecycle status
     * @return populated Order fixture
     */
    private Order buildOrder(Long id, OrderStatus status) {
        User customer = User.builder()
                .id(10L)
                .name("Jane Customer")
                .email("jane@urbanfresh.com")
                .password("hash")
                .role(Role.CUSTOMER)
                .build();

        Order order = Order.builder()
                .id(id)
                .customer(customer)
                .deliveryAddress("123 Main Street")
                .totalAmount(BigDecimal.valueOf(2999, 2))
                .status(status)
                .build();
        order.setCreatedAt(LocalDateTime.of(2026, 3, 15, 10, 30));
        return order;
    }

    @Test
    void getAllOrdersForAdmin_returnsPaginatedMappedResults() {
        Order order = buildOrder(1L, OrderStatus.PENDING);
        Page<Order> page = new PageImpl<>(List.of(order), PageRequest.of(0, 20), 1);
        when(orderRepository.findAllByOrderByCreatedAtDesc(any(Pageable.class))).thenReturn(page);

        Page<AdminOrderResponse> result = orderService.getAllOrdersForAdmin(0, 20);

        assertEquals(1, result.getTotalElements());
        AdminOrderResponse first = result.getContent().get(0);
        assertEquals(1L, first.getOrderId());
        assertEquals("Jane Customer", first.getCustomerName());
        assertEquals("PENDING", first.getOrderStatus());
        assertEquals("PENDING", first.getPaymentStatus());
    }

    @Test
    void updateOrderStatus_persistsValidTransitionAndReturnsUpdatedOrder() {
        Order order = buildOrder(2L, OrderStatus.PENDING);
        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setStatus("PROCESSING");

        when(orderRepository.findById(2L)).thenReturn(Optional.of(order));
        when(userRepository.findByEmail("admin@urbanfresh.test")).thenReturn(Optional.of(buildAdminUser()));
        when(orderRepository.save(order)).thenReturn(order);

        AdminOrderResponse result = orderService.updateOrderStatus(2L, request, "admin@urbanfresh.test");

        assertEquals("PROCESSING", result.getOrderStatus());
        assertEquals("PENDING", result.getPaymentStatus());
        verify(orderRepository).save(order);
        verify(orderStatusHistoryRepository).save(any());
    }

    @Test
    void updateOrderStatus_throwsWhenOrderDoesNotExist() {
        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setStatus("PROCESSING");
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        OrderNotFoundException ex = assertThrows(OrderNotFoundException.class,
            () -> orderService.updateOrderStatus(99L, request, "admin@urbanfresh.test"));

        assertTrue(ex.getMessage().contains("99"));
    }

    @Test
    void updateOrderStatus_throwsWhenTransitionIsNotAllowed() {
        Order order = buildOrder(3L, OrderStatus.READY);
        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setStatus("PENDING");

        when(orderRepository.findById(3L)).thenReturn(Optional.of(order));
        when(userRepository.findByEmail("admin@urbanfresh.test")).thenReturn(Optional.of(buildAdminUser()));

        InvalidOrderStatusTransitionException ex = assertThrows(InvalidOrderStatusTransitionException.class,
            () -> orderService.updateOrderStatus(3L, request, "admin@urbanfresh.test"));

        assertTrue(ex.getMessage().contains("Cannot transition"));
        }

        @Test
        void updateOrderStatus_throwsWhenCorrectionReasonMissing() {
        Order order = buildOrder(4L, OrderStatus.READY);
        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setStatus("PROCESSING");

        when(orderRepository.findById(4L)).thenReturn(Optional.of(order));
        when(userRepository.findByEmail("admin@urbanfresh.test")).thenReturn(Optional.of(buildAdminUser()));

        InvalidOrderStatusTransitionException ex = assertThrows(InvalidOrderStatusTransitionException.class,
            () -> orderService.updateOrderStatus(4L, request, "admin@urbanfresh.test"));

        assertTrue(ex.getMessage().contains("Correction reason"));
    }

    @Test
    void updateOrderStatus_allowsCancelledToProcessingTransition() {
        Order order = buildOrder(5L, OrderStatus.CANCELLED);
        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setStatus("PROCESSING");
        request.setChangeReason("Customer cancellation was accidental");

        when(orderRepository.findById(5L)).thenReturn(Optional.of(order));
        when(userRepository.findByEmail("admin@urbanfresh.test")).thenReturn(Optional.of(buildAdminUser()));
        when(orderRepository.save(order)).thenReturn(order);

        AdminOrderResponse result = orderService.updateOrderStatus(5L, request, "admin@urbanfresh.test");

        assertEquals("PROCESSING", result.getOrderStatus());
        verify(orderRepository).save(order);
        verify(orderStatusHistoryRepository).save(any());
    }

    @Test
    void getOrderReviewForAdmin_returnsDetailedOrderPayload() {
        Order order = buildOrder(7L, OrderStatus.PROCESSING);
        Product product = Product.builder().id(55L).name("Tomato").imageUrl("https://cdn.test/tomato.png").build();
        OrderItem item = OrderItem.builder()
                .order(order)
                .product(product)
                .productName("Tomato")
                .unitPrice(BigDecimal.valueOf(150, 2))
                .quantity(3)
                .lineTotal(BigDecimal.valueOf(450, 2))
                .build();
        order.getItems().add(item);

        User admin = buildAdminUser();
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .previousStatus(OrderStatus.PENDING)
                .newStatus(OrderStatus.PROCESSING)
                .changedByAdmin(admin)
                .changeReason("Validated payment")
                .build();
        history.setChangedAt(LocalDateTime.of(2026, 3, 15, 11, 15));

        when(orderRepository.findDetailedById(7L)).thenReturn(Optional.of(order));
        when(orderStatusHistoryRepository.findByOrderIdOrderByChangedAtDesc(7L)).thenReturn(List.of(history));

        AdminOrderReviewResponse result = orderService.getOrderReviewForAdmin(7L);

        assertEquals(7L, result.getOrderId());
        assertEquals("PROCESSING", result.getOrderStatus());
        assertEquals(1, result.getItems().size());
        assertEquals("Tomato", result.getItems().get(0).getProductName());
        assertEquals("Validated payment", result.getStatusHistory().get(0).getChangeReason());
        assertEquals(LocalDateTime.of(2026, 3, 15, 11, 15), result.getLastUpdatedDate());
    }

    @Test
    void updateOrderStatus_doesNotChangePaidPaymentStatus() {
        Order order = buildOrder(6L, OrderStatus.READY);
        order.setPaymentStatus(PaymentStatus.PAID);

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setStatus("PROCESSING");
        request.setChangeReason("Kitchen correction");

        when(orderRepository.findById(6L)).thenReturn(Optional.of(order));
        when(userRepository.findByEmail("admin@urbanfresh.test")).thenReturn(Optional.of(buildAdminUser()));
        when(orderRepository.save(order)).thenReturn(order);

        AdminOrderResponse result = orderService.updateOrderStatus(6L, request, "admin@urbanfresh.test");

        assertEquals("PROCESSING", result.getOrderStatus());
        assertEquals("PAID", result.getPaymentStatus());
        assertEquals(PaymentStatus.PAID, order.getPaymentStatus());
    }
}
