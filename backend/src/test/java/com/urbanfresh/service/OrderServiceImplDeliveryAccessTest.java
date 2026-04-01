package com.urbanfresh.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;

import com.urbanfresh.dto.response.DeliveryAssignedOrderResponse;
import com.urbanfresh.dto.response.DeliveryOrderDetailsResponse;
import com.urbanfresh.exception.OrderNotFoundException;
import com.urbanfresh.model.Order;
import com.urbanfresh.model.OrderItem;
import com.urbanfresh.model.OrderStatus;
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

        OrderItem item = OrderItem.builder()
                .productName("Samba Rice 5kg")
                .unitPrice(new BigDecimal("1400.00"))
                .quantity(1)
                .lineTotal(new BigDecimal("1400.00"))
                .build();

        Order baseOrder = Order.builder()
                .id(101L)
                .status(OrderStatus.OUT_FOR_DELIVERY)
                .deliveryAddress("No. 25, Hill Street, Kandy")
                .assignedDeliveryPerson(deliveryUser)
                .build();

        Order detailedOrder = Order.builder()
                .id(101L)
                .status(OrderStatus.OUT_FOR_DELIVERY)
                .deliveryAddress("No. 25, Hill Street, Kandy")
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
}
