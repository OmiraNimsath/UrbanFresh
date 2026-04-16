package com.urbanfresh.security;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.urbanfresh.config.SecurityConfig;
import com.urbanfresh.controller.ProductController;
import com.urbanfresh.dto.response.ProductPageResponse;
import com.urbanfresh.dto.response.ProductResponse;
import com.urbanfresh.exception.GlobalExceptionHandler;
import com.urbanfresh.model.PricingUnit;
import com.urbanfresh.service.ProductService;

/**
 * Test Layer – Verifies public product endpoints expose only safe fields.
 */
@WebMvcTest(controllers = ProductController.class)
@Import({
        SecurityConfig.class,
        JwtAuthEntryPoint.class,
        RoleAccessDeniedHandler.class,
        GlobalExceptionHandler.class,
        JwtAuthFilter.class
})
class PublicEndpointDataExposureTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductService productService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @BeforeEach
    void setUp() {
        ProductResponse product = ProductResponse.builder()
                .id(1L)
                .name("Samba Rice 5kg")
                .description("Premium Samba rice")
                .price(BigDecimal.valueOf(1400.00))
                .unit(PricingUnit.PER_ITEM)
                .category("Grocery")
                .imageUrl("/assets/images/rice_5kg.jpg")
                .featured(true)
                .expiryDate(LocalDate.now().plusDays(20))
                .inStock(true)
                .build();

        when(productService.searchProducts(nullable(String.class), nullable(String.class), nullable(String.class), anyInt(), anyInt()))
                .thenReturn(ProductPageResponse.builder()
                        .products(List.of(product))
                        .totalElements(1)
                        .totalPages(1)
                        .currentPage(0)
                        .pageSize(12)
                        .build());

        when(productService.getProductById(anyLong())).thenReturn(product);
    }

    /**
     * Catalogue response should include public product fields without internal/sensitive fields.
     */
    @Test
    void getProducts_doesNotExposeInternalOrSensitiveFields() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.products[0].id").value(1))
                .andExpect(jsonPath("$.products[0].name").value("Samba Rice 5kg"))
                .andExpect(jsonPath("$.products[0].price").value(1400.0))
                .andExpect(jsonPath("$.products[0].inStock").value(true))
                .andExpect(jsonPath("$.products[0].stockQuantity").exists())
                .andExpect(jsonPath("$.products[0].reorderThreshold").doesNotExist())
                .andExpect(jsonPath("$.products[0].password").doesNotExist())
                .andExpect(jsonPath("$.products[0].token").doesNotExist())
                .andExpect(jsonPath("$.products[0].supplierEmail").doesNotExist());
    }

    /**
     * Product detail should include only safe fields for public consumption.
     */
    @Test
    void getProductById_doesNotExposeInternalOrSensitiveFields() throws Exception {
        mockMvc.perform(get("/api/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Samba Rice 5kg"))
                .andExpect(jsonPath("$.price").value(1400.0))
                .andExpect(jsonPath("$.inStock").value(true))
                .andExpect(jsonPath("$.stockQuantity").exists())
                .andExpect(jsonPath("$.reorderThreshold").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.internalCost").doesNotExist());
    }
}
