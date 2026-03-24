package com.urbanfresh.service.impl;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.request.CreateDeliveryPersonnelRequest;
import com.urbanfresh.dto.request.CreateSupplierRequest;
import com.urbanfresh.dto.request.BrandRequest;
import com.urbanfresh.dto.request.UpdateDeliveryPersonnelStatusRequest;
import com.urbanfresh.dto.request.UpdateSupplierRequest;
import com.urbanfresh.dto.request.UpdateSupplierStatusRequest;
import com.urbanfresh.dto.response.AdminStatsResponse;
import com.urbanfresh.dto.response.BrandResponse;
import com.urbanfresh.dto.response.DeliveryPersonnelResponse;
import com.urbanfresh.dto.response.SupplierResponse;
import com.urbanfresh.exception.BrandAssignmentException;
import com.urbanfresh.exception.BrandConflictException;
import com.urbanfresh.exception.BrandNotFoundException;
import com.urbanfresh.exception.DuplicateEmailException;
import com.urbanfresh.exception.UserNotFoundException;
import com.urbanfresh.model.Brand;
import com.urbanfresh.model.Role;
import com.urbanfresh.model.SupplierBrand;
import com.urbanfresh.model.SupplierBrandId;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.BrandRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.SupplierBrandRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.AdminService;

import lombok.RequiredArgsConstructor;

/**
 * Service Layer – Implements admin business operations.
 * Aggregates data from the User and Product repositories.
 * Handles delivery personnel account management with validation and encryption.
 */
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final SupplierBrandRepository supplierBrandRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Retrieve high-level platform statistics.
     * Uses JPA count queries to avoid loading full entity lists into memory.
     *
     * @return AdminStatsResponse with total user and product counts
     */
    @Override
    public AdminStatsResponse getStats() {
        return AdminStatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalProducts(productRepository.count())
                .build();
    }

    /**
     * Create a new delivery personnel account.
     * Validates unique email, hashes the password, and saves the user with DELIVERY role.
     *
     * @param request validated delivery personnel creation payload
     * @return DeliveryPersonnelResponse with created account info
     * @throws DuplicateEmailException if email is already registered
     */
    @Override
    @Transactional
    public DeliveryPersonnelResponse createDeliveryPersonnel(CreateDeliveryPersonnelRequest request) {
        // Check for duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException(request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(Role.DELIVERY)
                .isActive(true) // New delivery personnel accounts are active by default
                .build();

        User saved = userRepository.save(user);
        return toDeliveryPersonnelResponse(saved);
    }

    /**
     * Retrieve all delivery personnel (paginated).
     *
     * @param pageable pagination and sorting parameters
     * @return page of delivery personnel
     */
    @Override
    public Page<DeliveryPersonnelResponse> getDeliveryPersonnel(Pageable pageable) {
        return userRepository.findByRole(Role.DELIVERY, pageable)
                .map(this::toDeliveryPersonnelResponse);
    }

    /**
     * Activate or deactivate a delivery personnel account by ID.
     *
     * @param deliveryPersonnelId unique identifier
     * @param request contains isActive flag
     * @return updated delivery personnel response
     * @throws UserNotFoundException if user not found
     */
    @Override
    @Transactional
    public DeliveryPersonnelResponse updateDeliveryPersonnelStatus(Long deliveryPersonnelId, UpdateDeliveryPersonnelStatusRequest request) {
        User user = userRepository.findById(deliveryPersonnelId)
                .orElseThrow(() -> new UserNotFoundException("Delivery personnel not found with ID: " + deliveryPersonnelId));

        user.setIsActive(request.getIsActive());
        User updated = userRepository.save(user);
        return toDeliveryPersonnelResponse(updated);
    }

    /**
     * Create a new supplier account and assign brands in a single transaction.
     *
     * @param request validated supplier creation payload
     * @return created supplier response with assigned brands
     */
    @Override
    @Transactional
    public SupplierResponse createSupplier(CreateSupplierRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException(request.getEmail());
        }

        if (request.getBrandIds() == null || request.getBrandIds().isEmpty()) {
            throw new BrandAssignmentException("At least one brand must be assigned to a supplier.");
        }

        Set<Long> uniqueBrandIds = new HashSet<>(request.getBrandIds());
        List<Brand> brands = loadValidActiveBrands(uniqueBrandIds);

        User supplier = User.builder()
                .name(request.getName())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(Role.SUPPLIER)
                .isActive(true)
                .build();

        User savedSupplier = userRepository.save(supplier);

        List<SupplierBrand> mappings = brands.stream()
                .map(brand -> SupplierBrand.builder()
                        .id(new SupplierBrandId(savedSupplier.getId(), brand.getId()))
                        .supplier(savedSupplier)
                        .brand(brand)
                        .build())
                .toList();

        supplierBrandRepository.saveAll(mappings);
        return toSupplierResponse(savedSupplier, mappings);
    }

    /**
     * Retrieve all suppliers and their assigned brands.
     *
     * @return list of supplier responses
     */
    @Override
    @Transactional(readOnly = true)
    public List<SupplierResponse> getSuppliers() {
        return userRepository.findByRoleOrderByNameAsc(Role.SUPPLIER)
                .stream()
                .map(this::toSupplierResponse)
                .toList();
    }

    /**
     * Activate or deactivate an existing supplier account.
     *
     * @param supplierId supplier account ID
     * @param request activation payload
     * @return updated supplier response
     */
    @Override
    @Transactional
    public SupplierResponse updateSupplierStatus(Long supplierId, UpdateSupplierStatusRequest request) {
        User supplier = userRepository.findByIdAndRole(supplierId, Role.SUPPLIER)
                .orElseThrow(() -> new UserNotFoundException("Supplier not found with ID: " + supplierId));

        supplier.setIsActive(request.getIsActive());
        User updated = userRepository.save(supplier);
        return toSupplierResponse(updated);
    }

    /**
     * Update supplier profile details and replace assigned brands.
     *
     * @param supplierId supplier account ID
     * @param request validated update payload
     * @return updated supplier response with assigned brands
     */
    @Override
    @Transactional
    public SupplierResponse updateSupplier(Long supplierId, UpdateSupplierRequest request) {
        User supplier = userRepository.findByIdAndRole(supplierId, Role.SUPPLIER)
                .orElseThrow(() -> new UserNotFoundException("Supplier not found with ID: " + supplierId));

        Set<Long> uniqueBrandIds = new HashSet<>(request.getBrandIds());
        List<Brand> brands = loadValidActiveBrands(uniqueBrandIds);

        supplier.setName(request.getName().trim());
        supplier.setPhone(normalizePhone(request.getPhone()));
        userRepository.save(supplier);

        supplierBrandRepository.deleteBySupplierId(supplierId);
        List<SupplierBrand> mappings = brands.stream()
                .map(brand -> SupplierBrand.builder()
                        .id(new SupplierBrandId(supplierId, brand.getId()))
                        .supplier(supplier)
                        .brand(brand)
                        .build())
                .toList();
        supplierBrandRepository.saveAll(mappings);

        return toSupplierResponse(supplier, mappings);
    }

    /**
     * Retrieve active brands for assignment forms.
     *
     * @return list of active brands
     */
    @Override
    @Transactional(readOnly = true)
    public List<BrandResponse> getActiveBrands() {
        return brandRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toBrandResponse)
                .toList();
    }

    /**
     * Retrieve all brands for admin management views.
     *
     * @return list of all brands
     */
    @Override
    @Transactional(readOnly = true)
    public List<BrandResponse> getAllBrands() {
        return brandRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toBrandResponse)
                .toList();
    }

    /**
     * Create a new brand with uniqueness validation for name and code.
     *
     * @param request validated create payload
     * @return created brand response
     */
    @Override
    @Transactional
    public BrandResponse createBrand(BrandRequest request) {
        String normalizedName = normalizeRequired(request.getName());
        String normalizedCode = normalizeRequired(request.getCode()).toUpperCase();

        if (brandRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new BrandConflictException("A brand with this name already exists.");
        }
        if (brandRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new BrandConflictException("A brand with this code already exists.");
        }

        Brand brand = Brand.builder()
                .name(normalizedName)
                .code(normalizedCode)
                .active(true)
                .build();

        return toBrandResponse(brandRepository.save(brand));
    }

    /**
     * Update a brand's display name and code with uniqueness checks.
     *
     * @param brandId brand ID
     * @param request validated update payload
     * @return updated brand response
     */
    @Override
    @Transactional
    public BrandResponse updateBrand(Long brandId, BrandRequest request) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new BrandNotFoundException(brandId));

        String normalizedName = normalizeRequired(request.getName());
        String normalizedCode = normalizeRequired(request.getCode()).toUpperCase();

        if (brandRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, brandId)) {
            throw new BrandConflictException("A brand with this name already exists.");
        }
        if (brandRepository.existsByCodeIgnoreCaseAndIdNot(normalizedCode, brandId)) {
            throw new BrandConflictException("A brand with this code already exists.");
        }

        brand.setName(normalizedName);
        brand.setCode(normalizedCode);
        return toBrandResponse(brandRepository.save(brand));
    }

    /**
     * Soft delete a brand by setting active=false.
     *
     * @param brandId brand ID
     */
    @Override
    @Transactional
    public void deleteBrand(Long brandId) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new BrandNotFoundException(brandId));
        brand.setActive(false);
        brandRepository.save(brand);
    }

    /** Map User entity → DeliveryPersonnelResponse DTO. Centralised to keep mapping DRY. */
    private DeliveryPersonnelResponse toDeliveryPersonnelResponse(User user) {
        return DeliveryPersonnelResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private SupplierResponse toSupplierResponse(User supplier) {
        List<SupplierBrand> mappings = supplierBrandRepository.findBySupplierId(supplier.getId());
        return toSupplierResponse(supplier, mappings);
    }

    private SupplierResponse toSupplierResponse(User supplier, List<SupplierBrand> mappings) {
        List<BrandResponse> brands = mappings.stream()
                .map(mapping -> toBrandResponse(mapping.getBrand()))
                .toList();

        return SupplierResponse.builder()
                .id(supplier.getId())
                .name(supplier.getName())
                .email(supplier.getEmail())
                .phone(supplier.getPhone())
                .isActive(supplier.getIsActive())
                .createdAt(supplier.getCreatedAt())
                .brands(brands)
                .build();
    }

    private BrandResponse toBrandResponse(Brand brand) {
        return BrandResponse.builder()
                .id(brand.getId())
                .name(brand.getName())
                .code(brand.getCode())
                .active(brand.getActive())
                .build();
    }

    private List<Brand> loadValidActiveBrands(Set<Long> brandIds) {
        List<Brand> brands = brandRepository.findAllById(brandIds);
        if (brands.size() != brandIds.size()) {
            throw new BrandAssignmentException("One or more provided brand IDs are invalid.");
        }
        boolean hasInactiveBrand = brands.stream().anyMatch(brand -> !Boolean.TRUE.equals(brand.getActive()));
        if (hasInactiveBrand) {
            throw new BrandAssignmentException("Only active brands can be assigned to suppliers.");
        }
        return brands;
    }

    private String normalizeRequired(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }
        String trimmed = phone.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
