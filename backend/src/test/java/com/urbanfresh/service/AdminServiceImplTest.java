package com.urbanfresh.service;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.urbanfresh.dto.request.BrandRequest;
import com.urbanfresh.dto.request.CreateSupplierRequest;
import com.urbanfresh.dto.request.UpdateSupplierRequest;
import com.urbanfresh.dto.request.UpdateSupplierStatusRequest;
import com.urbanfresh.dto.response.BrandResponse;
import com.urbanfresh.dto.response.SupplierResponse;
import com.urbanfresh.exception.BrandAssignmentException;
import com.urbanfresh.exception.BrandConflictException;
import com.urbanfresh.exception.DuplicateEmailException;
import com.urbanfresh.exception.UserNotFoundException;
import com.urbanfresh.model.Brand;
import com.urbanfresh.model.Role;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.BrandRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.SupplierBrandRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.impl.AdminServiceImpl;

/**
 * Test Layer – Unit tests for supplier account onboarding and status management.
 */
@ExtendWith(MockitoExtension.class)
class AdminServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
        @SuppressWarnings("unused")
    private ProductRepository productRepository;

    @Mock
    private BrandRepository brandRepository;

    @Mock
    private SupplierBrandRepository supplierBrandRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminServiceImpl adminService;

    /**
     * Verifies supplier account is created and persisted with assigned brands.
     */
    @Test
    void createSupplier_createsSupplierWithBrandMappings() {
        CreateSupplierRequest request = new CreateSupplierRequest(
                "Saira Supplier",
                "supplier@urbanfresh.test",
                "Temp@12345",
                "0775551212",
                List.of(1L, 2L)
        );

        Brand brandOne = Brand.builder().id(1L).name("FreshHarvest").code("FRESH").active(true).build();
        Brand brandTwo = Brand.builder().id(2L).name("GreenLeaf").code("GREEN").active(true).build();

        User savedSupplier = User.builder()
                .id(30L)
                .name("Saira Supplier")
                .email("supplier@urbanfresh.test")
                .role(Role.SUPPLIER)
                .isActive(true)
                .build();

        when(userRepository.existsByEmail("supplier@urbanfresh.test")).thenReturn(false);
        when(brandRepository.findAllById(any())).thenReturn(List.of(brandOne, brandTwo));
        when(passwordEncoder.encode("Temp@12345")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenReturn(savedSupplier);

        SupplierResponse response = adminService.createSupplier(request);

        assertThat(response.getId()).isEqualTo(30L);
        assertThat(response.getEmail()).isEqualTo("supplier@urbanfresh.test");
        assertThat(response.getBrands()).hasSize(2);
        verify(supplierBrandRepository).saveAll(any());
    }

    /**
     * Verifies supplier creation fails when brand assignment is missing.
     */
    @Test
    void createSupplier_throwsWhenBrandAssignmentMissing() {
        CreateSupplierRequest request = new CreateSupplierRequest(
                "Saira Supplier",
                "supplier@urbanfresh.test",
                "Temp@12345",
                "0775551212",
                List.of()
        );

        when(userRepository.existsByEmail("supplier@urbanfresh.test")).thenReturn(false);

        assertThatThrownBy(() -> adminService.createSupplier(request))
                .isInstanceOf(BrandAssignmentException.class)
                .hasMessageContaining("At least one brand must be assigned");

        verify(brandRepository, never()).findAllById(any());
        verify(userRepository, never()).save(any(User.class));
    }

    /**
     * Verifies supplier creation fails when any brand ID is invalid.
     */
    @Test
    void createSupplier_throwsWhenBrandIdsInvalid() {
        CreateSupplierRequest request = new CreateSupplierRequest(
                "Saira Supplier",
                "supplier@urbanfresh.test",
                "Temp@12345",
                "0775551212",
                List.of(1L, 999L)
        );

        Brand brandOne = Brand.builder().id(1L).name("FreshHarvest").code("FRESH").active(true).build();

        when(userRepository.existsByEmail("supplier@urbanfresh.test")).thenReturn(false);
        when(brandRepository.findAllById(any())).thenReturn(List.of(brandOne));

        assertThatThrownBy(() -> adminService.createSupplier(request))
                .isInstanceOf(BrandAssignmentException.class)
                .hasMessageContaining("invalid");
    }

    /**
     * Verifies duplicate supplier email is rejected.
     */
    @Test
    void createSupplier_throwsWhenEmailExists() {
        CreateSupplierRequest request = new CreateSupplierRequest(
                "Saira Supplier",
                "supplier@urbanfresh.test",
                "Temp@12345",
                "0775551212",
                List.of(1L)
        );

        when(userRepository.existsByEmail("supplier@urbanfresh.test")).thenReturn(true);

        assertThatThrownBy(() -> adminService.createSupplier(request))
                .isInstanceOf(DuplicateEmailException.class);
    }

    /**
     * Verifies supplier account status can be toggled by admin.
     */
    @Test
    void updateSupplierStatus_updatesSupplierActivationFlag() {
        User supplier = User.builder()
                .id(44L)
                .name("Supplier")
                .email("supplier@urbanfresh.test")
                .role(Role.SUPPLIER)
                .isActive(true)
                .build();

        when(userRepository.findByIdAndRole(44L, Role.SUPPLIER)).thenReturn(Optional.of(supplier));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(supplierBrandRepository.findBySupplierId(44L)).thenReturn(List.of());

        SupplierResponse response = adminService.updateSupplierStatus(44L, new UpdateSupplierStatusRequest(false));

        assertThat(response.getIsActive()).isFalse();
    }

    /**
     * Verifies status update rejects unknown supplier IDs.
     */
    @Test
    void updateSupplierStatus_throwsWhenSupplierNotFound() {
        when(userRepository.findByIdAndRole(44L, Role.SUPPLIER)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.updateSupplierStatus(44L, new UpdateSupplierStatusRequest(false)))
                .isInstanceOf(UserNotFoundException.class);
    }

    /**
     * Verifies supplier update replaces brand assignments.
     */
    @Test
    void updateSupplier_replacesBrandMappings() {
        User supplier = User.builder()
                .id(44L)
                .name("Old Supplier")
                .email("supplier@urbanfresh.test")
                .role(Role.SUPPLIER)
                .isActive(true)
                .build();
        Brand brandOne = Brand.builder().id(1L).name("FreshHarvest").code("FRESH").active(true).build();
        Brand brandTwo = Brand.builder().id(2L).name("GreenLeaf").code("GREEN").active(true).build();

        when(userRepository.findByIdAndRole(44L, Role.SUPPLIER)).thenReturn(Optional.of(supplier));
        when(brandRepository.findAllById(any())).thenReturn(List.of(brandOne, brandTwo));

        SupplierResponse response = adminService.updateSupplier(
                44L,
                new UpdateSupplierRequest("Updated Supplier", "0775551212", List.of(1L, 2L))
        );

        assertThat(response.getName()).isEqualTo("Updated Supplier");
        assertThat(response.getBrands()).hasSize(2);
        verify(supplierBrandRepository).deleteBySupplierId(44L);
        verify(supplierBrandRepository).saveAll(any());
    }

    /**
     * Verifies brand create succeeds with unique name and code.
     */
    @Test
    void createBrand_createsNewBrand() {
        Brand savedBrand = Brand.builder().id(10L).name("Island Green").code("IG").active(true).build();

        when(brandRepository.existsByNameIgnoreCase("Island Green")).thenReturn(false);
        when(brandRepository.existsByCodeIgnoreCase("IG")).thenReturn(false);
        when(brandRepository.save(any(Brand.class))).thenReturn(savedBrand);

        BrandResponse response = adminService.createBrand(new BrandRequest("Island Green", "ig"));

        assertThat(response.getName()).isEqualTo("Island Green");
        assertThat(response.getCode()).isEqualTo("IG");
        assertThat(response.getActive()).isTrue();
    }

    /**
     * Verifies create brand rejects duplicate name.
     */
    @Test
    void createBrand_throwsWhenNameExists() {
        when(brandRepository.existsByNameIgnoreCase("Island Green")).thenReturn(true);

        assertThatThrownBy(() -> adminService.createBrand(new BrandRequest("Island Green", "IG")))
                .isInstanceOf(BrandConflictException.class);
    }
}
