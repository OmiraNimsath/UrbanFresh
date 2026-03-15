package com.urbanfresh.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.urbanfresh.service.AdminProductService;
import com.urbanfresh.service.AdminService;
import com.urbanfresh.service.OrderService;

/**
 * Integration security tests for admin order endpoints.
 * Layer: Controller
 */
@SpringBootTest
class AdminOrderSecurityTest {

    @Autowired
    private WebApplicationContext context;

    @MockitoBean
    private AdminService adminService;

    @MockitoBean
    private AdminProductService adminProductService;

    @MockitoBean
    private OrderService orderService;

    private MockMvc mockMvc;

    /**
     * Builds MockMvc with Spring Security filter chain for each test.
     */
    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    /**
     * Ensures non-admin users cannot access admin order APIs.
     *
     * @throws Exception when request execution fails
     */
    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getOrders_returnsForbidden_forNonAdminUser() throws Exception {
        mockMvc.perform(get("/api/admin/orders"))
                .andExpect(status().isForbidden());
    }

    /**
     * Ensures non-admin users cannot access individual admin order review APIs.
     *
     * @throws Exception when request execution fails
     */
    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getOrderReview_returnsForbidden_forNonAdminUser() throws Exception {
        mockMvc.perform(get("/api/admin/orders/1"))
                .andExpect(status().isForbidden());
    }
}
