package com.urbanfresh.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;

import com.urbanfresh.dto.request.OrderStatusUpdateRequest;
import com.urbanfresh.dto.response.DeliveryAssignedOrderResponse;
import com.urbanfresh.dto.response.DeliveryOrderDetailsResponse;
import com.urbanfresh.exception.InvalidOrderStatusTransitionException;
import com.urbanfresh.exception.OrderNotFoundException;
import com.urbanfresh.model.Order;
import com.urbanfresh.model.OrderItem;
import com.urbanfresh.model.OrderStatus;
import com.urbanfresh.model.OrderStatusHistory;
import com.urbanfresh.model.PaymentStatus;
import com.urbanfresh.model.Role;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.OrderRepository;
import com.urbanfresh.repository.OrderStatusHistoryRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.impl.OrderServiceImpl;

/**
 * Test Layer – Unit tests for delivery assignment-based order access.
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceImplDeliveryAccessTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    @SuppressWarnings("unused")
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    @SuppressWarnings("unused")
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    @Test
    void getAssignedOrdersForDelivery_returnsMappedAssignedOrders() {
        User deliveryUser = User.builder()
                .id(20L)
                .email("delivery@urbanfresh.test")
                .role(Role.DELIVERY)
                .isActive(true)
                .build();

        User customer = User.builder()
                .id(4L)
                .name("Kumar Perera")
                .build();

        OrderItem firstItem = OrderItem.builder().productName("Samba Rice 5kg").build();
        OrderItem secondItem = OrderItem.builder().productName("Coconut Fresh (1 pc)").build();

        Order assignedOrder = Order.builder()
                .id(77L)
                .customer(customer)
                .deliveryAddress("No. 10, Main Street, Kandy, Sri Lanka")
                .status(OrderStatus.OUT_FOR_DELIVERY)
                .paymentStatus(PaymentStatus.PAID)
                .totalAmount(new BigDecimal("1800.00"))
                .assignedDeliveryPerson(deliveryUser)
                .items(List.of(firstItem, secondItem))
                .createdAt(LocalDateTime.of(2026, 4, 1, 9, 30))
                .build();

        when(userRepository.findByEmailAndRoleAndIsActiveTrue("delivery@urbanfresh.test", Role.DELIVERY))
                .thenReturn(Optional.of(deliveryUser));
        when(orderRepository.findByAssignedDeliveryPersonIdOrderByCreatedAtDesc(
                20L,
                PageRequest.of(0, 20, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))))
                .thenReturn(new PageImpl<>(List.of(assignedOrder)));

        Page<DeliveryAssignedOrderResponse> response =
                orderService.getAssignedOrdersForDelivery("delivery@urbanfresh.test", 0, 20);

        assertThat(response.getContent()).hasSize(1);
        DeliveryAssignedOrderResponse first = response.getContent().get(0);
        assertThat(first.getOrderId()).isEqualTo(77L);
        assertThat(first.getCustomerName()).isEqualTo("Kumar Perera");
        assertThat(first.getPaymentStatus()).isEqualTo("PAID");
        assertThat(first.getPaymentMethod()).isEqualTo("ONLINE (STRIPE)");
        assertThat(first.getStatus()).isEqualTo("OUT_FOR_DELIVERY");
        assertThat(first.getItemCount()).isEqualTo(2);
        assertThat(first.getItemsSummary()).contains("Samba Rice 5kg");
    }

    @Test
    void getAssignedOrderDetailsForDelivery_returnsDetailsWhenAssigned() {
        User deliveryUser = User.builder()
                .id(20L)
                .email("delivery@urbanfresh.test")
                .role(Role.DELIVERY)
                .isActive(true)
                .build();

        User customer = User.builder()
                .id(4L)
                .name("Kumar Perera")
                .phone("0773456789")
                .build();

        OrderItem item = OrderItem.builder()
                .productName("Samba Rice 5kg")
                .unitPrice(new BigDecimal("1400.00"))
                .quantity(1)
                .lineTotal(new BigDecimal("1400.00"))
                .build();

        Order baseOrder = Order.builder()
                .id(101L)
                .status(OrderStatus.OUT_FOR_DELIVERY)
                .paymentStatus(PaymentStatus.PAID)
                .totalAmount(new BigDecimal("1400.00"))
                .deliveryAddress("No. 25, Hill Street, Kandy")
                .customer(customer)
                .assignedDeliveryPerson(deliveryUser)
                .build();

        Order detailedOrder = Order.builder()
                .id(101L)
                .status(OrderStatus.OUT_FOR_DELIVERY)
                .paymentStatus(PaymentStatus.PAID)
                .totalAmount(new BigDecimal("1400.00"))
                .deliveryAddress("No. 25, Hill Street, Kandy")
                .customer(customer)
                .assignedDeliveryPerson(deliveryUser)
                .items(List.of(item))
                .build();

        when(userRepository.findByEmailAndRoleAndIsActiveTrue("delivery@urbanfresh.test", Role.DELIVERY))
                .thenReturn(Optional.of(deliveryUser));
        when(orderRepository.findById(101L)).thenReturn(Optional.of(baseOrder));
        when(orderRepository.findDetailedByIdAndAssignedDeliveryPersonId(101L, 20L))
                .thenReturn(Optional.of(detailedOrder));

        DeliveryOrderDetailsResponse response =
                orderService.getAssignedOrderDetailsForDelivery(101L, "delivery@urbanfresh.test");

        assertThat(response.getOrderId()).isEqualTo(101L);
        assertThat(response.getStatus()).isEqualTo(OrderStatus.OUT_FOR_DELIVERY.name());
        assertThat(response.getCustomerPhone()).isEqualTo("0773456789");
        assertThat(response.getPaymentMethod()).isEqualTo("ONLINE (STRIPE)");
        assertThat(response.getDeliveryAddress()).isEqualTo("No. 25, Hill Street, Kandy");
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getProductName()).isEqualTo("Samba Rice 5kg");
    }

    @Test
    void getAssignedOrderDetailsForDelivery_throwsForbiddenWhenNotAssigned() {
        User requestedDeliveryUser = User.builder()
                .id(20L)
                .email("delivery@urbanfresh.test")
                .role(Role.DELIVERY)
                .isActive(true)
                .build();

        User differentAssignedUser = User.builder()
                .id(30L)
                .email("other.delivery@urbanfresh.test")
                .role(Role.DELIVERY)
                .isActive(true)
                .build();

        Order baseOrder = Order.builder()
                .id(101L)
                .assignedDeliveryPerson(differentAssignedUser)
                .build();

        when(userRepository.findByEmailAndRoleAndIsActiveTrue("delivery@urbanfresh.test", Role.DELIVERY))
                .thenReturn(Optional.of(requestedDeliveryUser));
        when(orderRepository.findById(101L)).thenReturn(Optional.of(baseOrder));

        assertThatThrownBy(() -> orderService.getAssignedOrderDetailsForDelivery(101L, "delivery@urbanfresh.test"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("not allowed");
    }

    @Test
    void getAssignedOrderDetailsForDelivery_throwsWhenOrderMissing() {
        User deliveryUser = User.builder()
                .id(20L)
                .email("delivery@urbanfresh.test")
                .role(Role.DELIVERY)
                .isActive(true)
                .build();

        when(userRepository.findByEmailAndRoleAndIsActiveTrue("delivery@urbanfresh.test", Role.DELIVERY))
                .thenReturn(Optional.of(deliveryUser));
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getAssignedOrderDetailsForDelivery(999L, "delivery@urbanfresh.test"))
                .isInstanceOf(OrderNotFoundException.class);
    }

    @Test
    void updateAssignedOrderStatusForDelivery_updatesToDeliveredAndWritesHistory() {
        User deliveryUser = User.builder()
                .id(20L)
                .email("delivery@urbanfresh.test")
                .name("Delivery Rider")
                .role(Role.DELIVERY)
                .isActive(true)
                .build();

        Order order = Order.builder()
                .id(101L)
                .status(OrderStatus.OUT_FOR_DELIVERY)
                .deliveryAddress("No. 25, Hill Street, Kandy")
                .assignedDeliveryPerson(deliveryUser)
                .items(List.of())
                .build();

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setStatus("DELIVERED");

        when(userRepository.findByEmailAndRoleAndIsActiveTrue("delivery@urbanfresh.test", Role.DELIVERY))
                .thenReturn(Optional.of(deliveryUser));
        when(orderRepository.findById(101L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.findDetailedByIdAndAssignedDeliveryPersonId(101L, 20L)).thenReturn(Optional.of(order));

        DeliveryOrderDetailsResponse response =
                orderService.updateAssignedOrderStatusForDelivery(101L, request, "delivery@urbanfresh.test");

        assertThat(response.getStatus()).isEqualTo("DELIVERED");

        ArgumentCaptor<OrderStatusHistory> historyCaptor = ArgumentCaptor.forClass(OrderStatusHistory.class);
        verify(orderStatusHistoryRepository).save(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getPreviousStatus()).isEqualTo(OrderStatus.OUT_FOR_DELIVERY);
        assertThat(historyCaptor.getValue().getNewStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(historyCaptor.getValue().getChangedByDelivery()).isEqualTo(deliveryUser);
        assertThat(historyCaptor.getValue().getChangedByAdmin()).isNull();
    }

    @Test
    void updateAssignedOrderStatusForDelivery_updatesToReturnedAndWritesHistory() {
        User deliveryUser = User.builder()
                .id(20L)
                .email("delivery@urbanfresh.test")
                .name("Delivery Rider")
                .role(Role.DELIVERY)
                .isActive(true)
                .build();

        Order order = Order.builder()
                .id(102L)
                .status(OrderStatus.OUT_FOR_DELIVERY)
                .deliveryAddress("No. 40, Temple Road, Kandy")
                .assignedDeliveryPerson(deliveryUser)
                .items(List.of())
                .build();

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setStatus("RETURNED");

        when(userRepository.findByEmailAndRoleAndIsActiveTrue("delivery@urbanfresh.test", Role.DELIVERY))
                .thenReturn(Optional.of(deliveryUser));
        when(orderRepository.findById(102L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.findDetailedByIdAndAssignedDeliveryPersonId(102L, 20L)).thenReturn(Optional.of(order));

        DeliveryOrderDetailsResponse response =
                orderService.updateAssignedOrderStatusForDelivery(102L, request, "delivery@urbanfresh.test");

        assertThat(response.getStatus()).isEqualTo("RETURNED");

        ArgumentCaptor<OrderStatusHistory> historyCaptor = ArgumentCaptor.forClass(OrderStatusHistory.class);
        verify(orderStatusHistoryRepository).save(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getPreviousStatus()).isEqualTo(OrderStatus.OUT_FOR_DELIVERY);
        assertThat(historyCaptor.getValue().getNewStatus()).isEqualTo(OrderStatus.RETURNED);
        assertThat(historyCaptor.getValue().getChangedByDelivery()).isEqualTo(deliveryUser);
        assertThat(historyCaptor.getValue().getChangedByAdmin()).isNull();
    }

    @Test
    void updateAssignedOrderStatusForDelivery_rejectsInvalidSourceStatus() {
        User deliveryUser = User.builder()
                .id(20L)
                .email("delivery@urbanfresh.test")
                .role(Role.DELIVERY)
                .isActive(true)
                .build();

        Order order = Order.builder()
                .id(101L)
                .status(OrderStatus.READY)
                .assignedDeliveryPerson(deliveryUser)
                .build();

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setStatus("DELIVERED");

        when(userRepository.findByEmailAndRoleAndIsActiveTrue("delivery@urbanfresh.test", Role.DELIVERY))
                .thenReturn(Optional.of(deliveryUser));
        when(orderRepository.findById(101L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() ->
                orderService.updateAssignedOrderStatusForDelivery(101L, request, "delivery@urbanfresh.test"))
                .isInstanceOf(InvalidOrderStatusTransitionException.class)
                .hasMessageContaining("OUT_FOR_DELIVERY");
    }

    @Test
    void updateAssignedOrderStatusForDelivery_rejectsUnsupportedTargetStatus() {
        User deliveryUser = User.builder()
                .id(20L)
                .email("delivery@urbanfresh.test")
                .role(Role.DELIVERY)
                .isActive(true)
                .build();

        Order order = Order.builder()
                .id(101L)
                .status(OrderStatus.OUT_FOR_DELIVERY)
                .assignedDeliveryPerson(deliveryUser)
                .build();

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setStatus("PROCESSING");

        when(userRepository.findByEmailAndRoleAndIsActiveTrue("delivery@urbanfresh.test", Role.DELIVERY))
                .thenReturn(Optional.of(deliveryUser));
        when(orderRepository.findById(101L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() ->
                orderService.updateAssignedOrderStatusForDelivery(101L, request, "delivery@urbanfresh.test"))
                .isInstanceOf(InvalidOrderStatusTransitionException.class)
                .hasMessageContaining("DELIVERED, RETURNED");
    }

    @Test
    void updateAssignedOrderStatusForDelivery_rejectsUnassignedDeliveryUser() {
        User requestedDeliveryUser = User.builder()
                .id(20L)
                .email("delivery@urbanfresh.test")
                .role(Role.DELIVERY)
                .isActive(true)
                .build();

        User assignedDeliveryUser = User.builder()
                .id(99L)
                .email("other.delivery@urbanfresh.test")
                .role(Role.DELIVERY)
                .isActive(true)
                .build();

        Order order = Order.builder()
                .id(101L)
                .status(OrderStatus.OUT_FOR_DELIVERY)
                .assignedDeliveryPerson(assignedDeliveryUser)
                .build();

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setStatus("DELIVERED");

        when(userRepository.findByEmailAndRoleAndIsActiveTrue("delivery@urbanfresh.test", Role.DELIVERY))
                .thenReturn(Optional.of(requestedDeliveryUser));
        when(orderRepository.findById(101L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() ->
                orderService.updateAssignedOrderStatusForDelivery(101L, request, "delivery@urbanfresh.test"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("not allowed");
    }
}
