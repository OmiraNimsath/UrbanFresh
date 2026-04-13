package com.urbanfresh.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.urbanfresh.dto.request.OrderStatusUpdateRequest;
import com.urbanfresh.model.Order;
import com.urbanfresh.model.OrderStatus;
import com.urbanfresh.model.PaymentStatus;
import com.urbanfresh.model.Role;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.OrderRepository;
import com.urbanfresh.repository.OrderStatusHistoryRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.impl.OrderServiceImpl;

/**
 * Test Layer – Verifies notification creation at each order status change trigger point.
 * Covers SCRUM-45 DoD: automated tests for notification creation logic.
 *
 * Three trigger paths are exercised here:
 *   1. Admin updates order status via updateOrderStatus()
 *   2. Delivery personnel updates order status via updateAssignedOrderStatusForDelivery()
 *   3. Admin assigns delivery personnel, transitioning READY → OUT_FOR_DELIVERY
 *
 * Uses Mockito only — no Spring context loaded, so these run fast.
 */
@ExtendWith(MockitoExtension.class)
class NotificationOrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderStatusHistoryRepository orderStatusHistoryRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private OrderServiceImpl orderService;

    // ── Shared test fixtures ────────────────────────────────────────────────────

    private final User customer = User.builder()
            .id(1L).name("Jane Doe").email("jane@example.com").role(Role.CUSTOMER).build();

    private final User adminUser = User.builder()
            .id(10L).name("Admin").email("admin@test.com").role(Role.ADMIN).build();

    private final User deliveryUser = User.builder()
            .id(20L).name("Rider").email("rider@test.com").role(Role.DELIVERY).isActive(true).build();

    // ── Trigger path 1: Admin status update ────────────────────────────────────

    /**
     * CONFIRMED → PROCESSING is a valid admin transition.
     * Notification must be created for the customer with the new target status.
     */
    @Test
    void updateOrderStatus_createsNotification_whenAdminAdvancesStatus() {
        Order order = Order.builder()
                .id(1L)
                .customer(customer)
                .status(OrderStatus.CONFIRMED)
                .paymentStatus(PaymentStatus.PAID)
                .totalAmount(BigDecimal.valueOf(3000))
                .build();

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setStatus("PROCESSING");

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(orderRepository.save(order)).thenReturn(order);

        orderService.updateOrderStatus(1L, request, "admin@test.com");

        verify(notificationService).createOrderStatusNotification(order, OrderStatus.PROCESSING);
    }

    // ── Trigger path 2: Delivery personnel status update ──────────────────────

    /**
     * OUT_FOR_DELIVERY → DELIVERED is the normal delivery completion path.
     * Notification must be created for the customer after the status is saved.
     */
    @Test
    void updateAssignedOrderStatusForDelivery_createsNotification_whenStatusChanged() {
        Order order = Order.builder()
                .id(1L)
                .customer(customer)
                .status(OrderStatus.OUT_FOR_DELIVERY)
                .paymentStatus(PaymentStatus.PAID)
                .totalAmount(BigDecimal.valueOf(2500))
                .assignedDeliveryPerson(deliveryUser)
                .build();

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setStatus("DELIVERED");

        when(userRepository.findByEmailAndRoleAndIsActiveTrue("rider@test.com", Role.DELIVERY))
                .thenReturn(Optional.of(deliveryUser));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);
        when(orderRepository.findDetailedByIdAndAssignedDeliveryPersonId(1L, deliveryUser.getId()))
                .thenReturn(Optional.of(order));

        orderService.updateAssignedOrderStatusForDelivery(1L, request, "rider@test.com");

        verify(notificationService).createOrderStatusNotification(order, OrderStatus.DELIVERED);
    }

    // ── Trigger path 3: Assignment READY → OUT_FOR_DELIVERY ───────────────────

    /**
     * Assigning delivery personnel to a READY order transitions it to OUT_FOR_DELIVERY.
     * Because the status changed a notification must be sent to the customer.
     */
    @Test
    void assignDeliveryPersonnel_createsNotification_whenReadyTransitionsToOutForDelivery() {
        Order order = Order.builder()
                .id(1L)
                .customer(customer)
                .status(OrderStatus.READY)
                .paymentStatus(PaymentStatus.PAID)
                .totalAmount(BigDecimal.valueOf(1800))
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(userRepository.findByIdAndRole(deliveryUser.getId(), Role.DELIVERY))
                .thenReturn(Optional.of(deliveryUser));
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(orderRepository.save(order)).thenReturn(order);

        orderService.assignDeliveryPersonnel(1L, deliveryUser.getId(), "admin@test.com");

        verify(notificationService).createOrderStatusNotification(order, OrderStatus.OUT_FOR_DELIVERY);
    }

    /**
     * Reassigning a delivery person to an order that is already OUT_FOR_DELIVERY
     * does not change the status, so NO notification should be created.
     * This guards against spurious duplicate notifications on reassignment.
     */
    @Test
    void assignDeliveryPersonnel_doesNotCreateNotification_whenStatusUnchanged() {
        Order order = Order.builder()
                .id(1L)
                .customer(customer)
                .status(OrderStatus.OUT_FOR_DELIVERY)
                .paymentStatus(PaymentStatus.PAID)
                .totalAmount(BigDecimal.valueOf(1800))
                .assignedDeliveryPerson(deliveryUser)
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(userRepository.findByIdAndRole(deliveryUser.getId(), Role.DELIVERY))
                .thenReturn(Optional.of(deliveryUser));
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(orderRepository.save(order)).thenReturn(order);

        orderService.assignDeliveryPersonnel(1L, deliveryUser.getId(), "admin@test.com");

        verify(notificationService, never()).createOrderStatusNotification(any(), any());
    }
}
