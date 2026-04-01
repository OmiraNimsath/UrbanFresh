package com.urbanfresh.controller;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.urbanfresh.dto.response.DeliveryAssignedOrderResponse;
import com.urbanfresh.dto.response.DeliveryOrderDetailsResponse;
import com.urbanfresh.dto.response.OrderItemResponse;
import com.urbanfresh.exception.GlobalExceptionHandler;
import com.urbanfresh.service.OrderService;

/**
 * Test Layer – Web integration tests for delivery order access endpoint.
 */
@ExtendWith(MockitoExtension.class)
class DeliveryControllerTest {

    private MockMvc mockMvc;
        private ObjectMapper objectMapper;

        @Mock
    private OrderService orderService;

        @InjectMocks
        private DeliveryController deliveryController;

        @BeforeEach
        void setUp() {
                mockMvc = MockMvcBuilders
                                .standaloneSetup(deliveryController)
                                .setControllerAdvice(new GlobalExceptionHandler())
                                .build();
                objectMapper = new ObjectMapper();
        }

    @Test
    void getAssignedOrders_returnsAssignedOrdersPage() throws Exception {
        Page<DeliveryAssignedOrderResponse> page = new PageImpl<>(List.of(
                DeliveryAssignedOrderResponse.builder()
                        .orderId(1L)
                        .customerName("Kumar Perera")
                        .customerPhone("0773456789")
                        .shortDeliveryAddress("No. 10, Main Street, Kandy")
                        .fullDeliveryAddress("No. 10, Main Street, Kandy")
                        .status("OUT_FOR_DELIVERY")
                        .itemCount(2)
                        .itemsSummary("Samba Rice 5kg, Coconut Fresh (1 pc)")
                        .totalAmount(new BigDecimal("1800.00"))
                        .paymentStatus("PAID")
                        .paymentMethod("ONLINE (STRIPE)")
                        .build()
        ), PageRequest.of(0, 20), 1);

        when(orderService.getAssignedOrdersForDelivery("delivery@urbanfresh.test", 0, 20))
                .thenReturn(page);

        mockMvc.perform(get("/api/delivery/orders")
                        .principal(new TestingAuthenticationToken("delivery@urbanfresh.test", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].orderId").value(1))
                .andExpect(jsonPath("$.content[0].customerName").value("Kumar Perera"))
                .andExpect(jsonPath("$.content[0].customerPhone").value("0773456789"))
                .andExpect(jsonPath("$.content[0].paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.content[0].status").value("OUT_FOR_DELIVERY"));
    }

    @Test
    void getAssignedOrderDetails_returnsOkForAssignedDeliveryUser() throws Exception {
        DeliveryOrderDetailsResponse response = DeliveryOrderDetailsResponse.builder()
                .orderId(1L)
                .status("OUT_FOR_DELIVERY")
                .customerName("Kumar Perera")
                .customerPhone("0773456789")
                .deliveryAddress("No. 10, Main Street, Kandy")
                .totalAmount(new BigDecimal("1400.00"))
                .paymentStatus("PAID")
                .paymentMethod("ONLINE (STRIPE)")
                .items(List.of(OrderItemResponse.builder()
                        .productId(12L)
                        .productName("Samba Rice 5kg")
                        .unitPrice(new BigDecimal("1400.00"))
                        .quantity(1)
                        .lineTotal(new BigDecimal("1400.00"))
                        .build()))
                .build();

        when(orderService.getAssignedOrderDetailsForDelivery(1L, "delivery@urbanfresh.test"))
                .thenReturn(response);

        mockMvc.perform(get("/api/delivery/orders/1")
                        .principal(new TestingAuthenticationToken("delivery@urbanfresh.test", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(1))
                .andExpect(jsonPath("$.status").value("OUT_FOR_DELIVERY"))
                .andExpect(jsonPath("$.customerPhone").value("0773456789"))
                .andExpect(jsonPath("$.paymentMethod").value("ONLINE (STRIPE)"))
                .andExpect(jsonPath("$.deliveryAddress").value("No. 10, Main Street, Kandy"))
                .andExpect(jsonPath("$.items[0].productName").value("Samba Rice 5kg"));
    }

    @Test
    void getAssignedOrderDetails_returnsForbiddenForUnassignedDeliveryUser() throws Exception {
        when(orderService.getAssignedOrderDetailsForDelivery(1L, "delivery@urbanfresh.test"))
                .thenThrow(new AccessDeniedException("You are not allowed to view this order."));

        mockMvc.perform(get("/api/delivery/orders/1")
                        .principal(new TestingAuthenticationToken("delivery@urbanfresh.test", null)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message")
                        .value("Access denied. You do not have permission to perform this action."));
    }

    @Test
    void updateAssignedOrderStatus_returnsUpdatedOrderForAssignedDeliveryUser() throws Exception {
        DeliveryOrderDetailsResponse response = DeliveryOrderDetailsResponse.builder()
                .orderId(1L)
                .status("DELIVERED")
                .deliveryAddress("No. 10, Main Street, Kandy")
                .items(List.of())
                .build();

        when(orderService.updateAssignedOrderStatusForDelivery(any(), any(), any()))
                .thenReturn(response);

        mockMvc.perform(patch("/api/delivery/orders/1/status")
                        .principal(new TestingAuthenticationToken("delivery@urbanfresh.test", null))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(java.util.Map.of("status", "DELIVERED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(1))
                .andExpect(jsonPath("$.status").value("DELIVERED"));
    }

    @Test
    void updateAssignedOrderStatus_returnsReturnedStatusWhenRequested() throws Exception {
        DeliveryOrderDetailsResponse response = DeliveryOrderDetailsResponse.builder()
                .orderId(1L)
                .status("RETURNED")
                .deliveryAddress("No. 10, Main Street, Kandy")
                .items(List.of())
                .build();

        when(orderService.updateAssignedOrderStatusForDelivery(any(), any(), any()))
                .thenReturn(response);

        mockMvc.perform(patch("/api/delivery/orders/1/status")
                        .principal(new TestingAuthenticationToken("delivery@urbanfresh.test", null))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(java.util.Map.of("status", "RETURNED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(1))
                .andExpect(jsonPath("$.status").value("RETURNED"));
    }

    @Test
    void updateAssignedOrderStatus_returnsForbiddenForUnassignedDeliveryUser() throws Exception {
        when(orderService.updateAssignedOrderStatusForDelivery(any(), any(), any()))
                .thenThrow(new AccessDeniedException("You are not allowed to update this order."));

        mockMvc.perform(patch("/api/delivery/orders/1/status")
                        .principal(new TestingAuthenticationToken("delivery@urbanfresh.test", null))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(java.util.Map.of("status", "DELIVERED"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void updateAssignedOrderStatus_returnsBadRequestWhenStatusMissing() throws Exception {
        mockMvc.perform(patch("/api/delivery/orders/1/status")
                        .principal(new TestingAuthenticationToken("delivery@urbanfresh.test", null))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(java.util.Map.of("changeReason", "missing status"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.status").value("status is required"));
    }
}
