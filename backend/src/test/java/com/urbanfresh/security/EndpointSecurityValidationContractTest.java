package com.urbanfresh.security;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.urbanfresh.config.SecurityConfig;
import com.urbanfresh.controller.AdminDashboardController;
import com.urbanfresh.controller.CartController;
import com.urbanfresh.controller.CustomerController;
import com.urbanfresh.controller.DeliveryController;
import com.urbanfresh.controller.OrderController;
import com.urbanfresh.controller.PaymentController;
import com.urbanfresh.controller.ProductController;
import com.urbanfresh.controller.ProfileController;
import com.urbanfresh.controller.SupplierController;
import com.urbanfresh.dto.AdminDashboardResponse;
import com.urbanfresh.dto.request.PlaceOrderRequest;
import com.urbanfresh.dto.response.CartResponse;
import com.urbanfresh.dto.response.OrderResponse;
import com.urbanfresh.dto.response.PaymentTrackingStatusResponse;
import com.urbanfresh.dto.response.ProductPageResponse;
import com.urbanfresh.dto.response.ProfileResponse;
import com.urbanfresh.dto.response.SupplierDashboardResponse;
import com.urbanfresh.exception.GlobalExceptionHandler;
import com.urbanfresh.service.AdminDashboardService;
import com.urbanfresh.service.CartService;
import com.urbanfresh.service.LoyaltyService;
import com.urbanfresh.service.OrderService;
import com.urbanfresh.service.PaymentService;
import com.urbanfresh.service.ProductService;
import com.urbanfresh.service.ProfileService;
import com.urbanfresh.service.SupplierService;

/**
 * Test Layer – Verifies RBAC and 4xx ApiErrorResponse contract for protected and public endpoints.
 */
@WebMvcTest(controllers = {
        AdminDashboardController.class,
        SupplierController.class,
        DeliveryController.class,
        CustomerController.class,
        CartController.class,
        OrderController.class,
        ProfileController.class,
        PaymentController.class,
        ProductController.class
})
@Import({
        SecurityConfig.class,
        JwtAuthEntryPoint.class,
        RoleAccessDeniedHandler.class,
        GlobalExceptionHandler.class,
        JwtAuthFilter.class
})
class EndpointSecurityValidationContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminDashboardService adminDashboardService;

    @MockitoBean
    private SupplierService supplierService;

    @MockitoBean
    private OrderService orderService;

    @MockitoBean
    private LoyaltyService loyaltyService;

    @MockitoBean
    private CartService cartService;

    @MockitoBean
    private ProfileService profileService;

    @MockitoBean
    private PaymentService paymentService;

    @MockitoBean
    private ProductService productService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @BeforeEach
    void setUp() {
        when(adminDashboardService.getDashboardMetrics())
                .thenReturn(new AdminDashboardResponse(0, 0.0, 0, 0, 0, 0, BigDecimal.ZERO, null));

        when(supplierService.getDashboardData(anyString()))
                .thenReturn(SupplierDashboardResponse.builder()
                        .brandNames(List.of())
                        .totalSales(BigDecimal.ZERO)
                        .pendingRestocks(0)
                        .build());

        when(orderService.getAssignedOrdersForDelivery(anyString(), anyInt(), anyInt()))
                .thenReturn(Page.empty());

        when(orderService.getMyOrders(anyString()))
                .thenReturn(List.of());

        when(cartService.getCart(anyString()))
                .thenReturn(CartResponse.builder()
                        .items(List.of())
                        .totalAmount(BigDecimal.ZERO)
                        .itemCount(0)
                        .build());

        when(orderService.placeOrder(any(PlaceOrderRequest.class), anyString()))
                .thenReturn(OrderResponse.builder()
                        .orderId(1L)
                        .status("PENDING")
                        .paymentStatus("PENDING")
                        .deliveryAddress("No 1, Main Street")
                        .totalAmount(BigDecimal.valueOf(500.00))
                        .createdAt(LocalDateTime.now())
                        .items(List.of())
                        .build());

        when(profileService.getProfile(anyString()))
                .thenReturn(ProfileResponse.builder()
                        .id(1L)
                        .name("Test User")
                        .email("user@urbanfresh.com")
                        .phone("0712345678")
                        .address("Colombo")
                        .role("CUSTOMER")
                        .build());

        when(paymentService.getPaymentTrackingStatus(anyLong(), anyString()))
                .thenReturn(PaymentTrackingStatusResponse.builder()
                        .orderId(1L)
                        .paymentStatus("PENDING")
                        .chargeUpdatedEventReceived(false)
                        .terminal(false)
                        .build());

        when(productService.searchProducts(anyString(), anyString(), anyString(), anyInt(), anyInt()))
                .thenReturn(ProductPageResponse.builder()
                        .products(List.of())
                        .totalElements(0)
                        .totalPages(0)
                        .currentPage(0)
                        .pageSize(12)
                        .build());

        when(productService.getNearExpiryProducts(anyInt())).thenReturn(List.of());
    }

    /**
     * Confirms ADMIN route blocks unauthenticated users with ApiErrorResponse-shaped 401.
     */
    @Test
    void adminEndpoint_withoutToken_returns401InApiErrorResponseShape() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.timestamp").exists());
    }

    /**
     * Confirms wrong-role access is denied with ApiErrorResponse-shaped 403.
     */
    @Test
    void adminEndpoint_withCustomerRole_returns403InApiErrorResponseShape() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .with(user("customer@urbanfresh.com").roles("CUSTOMER")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void adminEndpoint_withAdminRole_returns200() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .with(user("admin@urbanfresh.com").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void supplierEndpoint_withSupplierRole_returns200() throws Exception {
        mockMvc.perform(get("/api/supplier/dashboard")
                        .with(user("supplier@urbanfresh.com").roles("SUPPLIER")))
                .andExpect(status().isOk());
    }

    @Test
    void deliveryEndpoint_withDeliveryRole_returns200() throws Exception {
        mockMvc.perform(get("/api/delivery/orders")
                        .with(user("delivery@urbanfresh.com").roles("DELIVERY")))
                .andExpect(status().isOk());
    }

    @Test
    void customerEndpoint_withCustomerRole_returns200() throws Exception {
        mockMvc.perform(get("/api/customer/orders")
                        .with(user("customer@urbanfresh.com").roles("CUSTOMER")))
                .andExpect(status().isOk());
    }

    @Test
    void cartEndpoint_withCustomerRole_returns200() throws Exception {
        mockMvc.perform(get("/api/cart")
                        .with(user("customer@urbanfresh.com").roles("CUSTOMER")))
                .andExpect(status().isOk());
    }

    @Test
    void orderEndpoint_withValidPayload_returns201() throws Exception {
        String payload = """
                {
                  "deliveryAddress": "No 1, Main Street",
                  "items": [
                    {"productId": 1, "quantity": 1}
                  ]
                }
                """;

        mockMvc.perform(post("/api/orders")
                        .with(user("customer@urbanfresh.com").roles("CUSTOMER"))
                        .contentType(APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated());
    }

    @Test
    void profileEndpoint_withCustomerRole_returns200() throws Exception {
        mockMvc.perform(get("/api/profile")
                        .with(user("customer@urbanfresh.com").roles("CUSTOMER")))
                .andExpect(status().isOk());
    }

    @Test
    void profileEndpoint_withDeliveryRole_returns200() throws Exception {
        mockMvc.perform(get("/api/profile")
                        .with(user("delivery@urbanfresh.com").roles("DELIVERY")))
                .andExpect(status().isOk());
    }

    @Test
    void paymentTrackingEndpoint_withCustomerRole_returns200() throws Exception {
        mockMvc.perform(get("/api/payments/orders/1/status")
                        .with(user("customer@urbanfresh.com").roles("CUSTOMER")))
                .andExpect(status().isOk());
    }

    /**
     * Public endpoint should stay open and handle request safely without authentication.
     */
    @Test
    void publicProductsEndpoint_withoutToken_returns200() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk());
    }

    /**
     * Public endpoint invalid path variable should return ApiErrorResponse-shaped 400.
     */
    @Test
    void publicProductById_withInvalidPathType_returns400InApiErrorResponseShape() throws Exception {
        mockMvc.perform(get("/api/products/not-a-number"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.timestamp").exists());
    }

    /**
     * Missing required webhook header should return ApiErrorResponse-shaped 400.
     */
    @Test
    void paymentWebhook_withoutStripeSignature_returns400InApiErrorResponseShape() throws Exception {
        mockMvc.perform(post("/api/payments/webhook")
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.timestamp").exists());
    }

    /**
     * Malformed JSON on a protected endpoint should return ApiErrorResponse-shaped 400.
     */
    @Test
    void orderEndpoint_withMalformedJson_returns400InApiErrorResponseShape() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .with(user("customer@urbanfresh.com").roles("CUSTOMER"))
                        .contentType(APPLICATION_JSON)
                        .content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.timestamp").exists());
    }

    /**
     * Bean-validation failures should preserve consistent response shape with field-level errors.
     */
    @Test
    void orderEndpoint_withInvalidBody_returns400WithFieldErrors() throws Exception {
        String payload = """
                {
                  "deliveryAddress": "",
                  "items": []
                }
                """;

        mockMvc.perform(post("/api/orders")
                        .with(user("customer@urbanfresh.com").roles("CUSTOMER"))
                        .contentType(APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.deliveryAddress").exists())
                .andExpect(jsonPath("$.errors.items").exists())
                .andExpect(jsonPath("$.timestamp").exists());
    }
}
