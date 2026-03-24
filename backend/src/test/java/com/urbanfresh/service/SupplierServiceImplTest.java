package com.urbanfresh.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.urbanfresh.dto.response.BrandResponse;
import com.urbanfresh.dto.response.SupplierProductResponse;
import com.urbanfresh.exception.SupplierInactiveException;
import com.urbanfresh.model.Brand;
import com.urbanfresh.model.PricingUnit;
import com.urbanfresh.model.Product;
import com.urbanfresh.model.Role;
import com.urbanfresh.model.SupplierBrand;
import com.urbanfresh.model.SupplierBrandId;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.SupplierBrandRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.impl.SupplierServiceImpl;

/**
 * Test Layer – Unit tests for supplier brand-scoped service behavior.
 */
@ExtendWith(MockitoExtension.class)
class SupplierServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SupplierBrandRepository supplierBrandRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private SupplierServiceImpl supplierService;

    /**
     * Verifies supplier products are fetched using supplier ID and mapped into DTOs.
     */
    @Test
    void getSupplierProducts_returnsBrandScopedProducts() {
        User supplier = User.builder()
                .id(10L)
                .email("supplier@urbanfresh.test")
                .role(Role.SUPPLIER)
                .isActive(true)
                .build();

        Brand brand = Brand.builder().id(1L).name("FreshHarvest").code("FRESH").active(true).build();
        Product product = Product.builder()
                .id(100L)
                .name("Organic Bananas")
                .category("Fruits")
                .brand(brand)
                .price(BigDecimal.valueOf(200))
                .unit(PricingUnit.PER_KG)
                .stockQuantity(50)
                .build();

        when(userRepository.findByEmailAndRoleAndIsActiveTrue("supplier@urbanfresh.test", Role.SUPPLIER))
                .thenReturn(Optional.of(supplier));
        when(productRepository.findProductsForSupplier(10L)).thenReturn(List.of(product));

        List<SupplierProductResponse> result = supplierService.getSupplierProducts("supplier@urbanfresh.test");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Organic Bananas");
        assertThat(result.get(0).getBrandName()).isEqualTo("FreshHarvest");
        verify(productRepository).findProductsForSupplier(10L);
    }

    /**
     * Verifies assigned supplier brands are returned for dashboard rendering.
     */
    @Test
    void getAssignedBrands_returnsMappedBrands() {
        User supplier = User.builder()
                .id(10L)
                .email("supplier@urbanfresh.test")
                .role(Role.SUPPLIER)
                .isActive(true)
                .build();

        Brand brand = Brand.builder().id(1L).name("FreshHarvest").code("FRESH").active(true).build();
        SupplierBrand mapping = SupplierBrand.builder()
                .id(new SupplierBrandId(10L, 1L))
                .supplier(supplier)
                .brand(brand)
                .build();

        when(userRepository.findByEmailAndRoleAndIsActiveTrue("supplier@urbanfresh.test", Role.SUPPLIER))
                .thenReturn(Optional.of(supplier));
        when(supplierBrandRepository.findBySupplierId(10L)).thenReturn(List.of(mapping));

        List<BrandResponse> result = supplierService.getAssignedBrands("supplier@urbanfresh.test");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("FreshHarvest");
        assertThat(result.get(0).getCode()).isEqualTo("FRESH");
    }

    /**
     * Verifies inactive suppliers are blocked from supplier-scoped APIs.
     */
    @Test
    void getSupplierProducts_throwsWhenSupplierInactive() {
        when(userRepository.findByEmailAndRoleAndIsActiveTrue("supplier@urbanfresh.test", Role.SUPPLIER))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> supplierService.getSupplierProducts("supplier@urbanfresh.test"))
                .isInstanceOf(SupplierInactiveException.class);
    }
}
