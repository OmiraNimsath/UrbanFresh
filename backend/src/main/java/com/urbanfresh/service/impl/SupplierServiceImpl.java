package com.urbanfresh.service.impl;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.request.ProductRequest;
import com.urbanfresh.dto.response.BrandResponse;
import com.urbanfresh.dto.response.SupplierDashboardResponse;
import com.urbanfresh.dto.response.SupplierProductResponse;
import com.urbanfresh.exception.SupplierInactiveException;
import com.urbanfresh.model.ApprovalStatus;
import com.urbanfresh.model.Brand;
import com.urbanfresh.model.Product;
import com.urbanfresh.model.Role;
import com.urbanfresh.model.SupplierBrand;
import com.urbanfresh.model.SupplierBrandId;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.BrandRepository;
import com.urbanfresh.repository.OrderItemRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.SupplierBrandRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.SupplierService;

import lombok.RequiredArgsConstructor;

/**
 * Service Layer - Implements supplier-facing brand-scoped operations.
 */
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {

    private final UserRepository userRepository;
    private final SupplierBrandRepository supplierBrandRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final BrandRepository brandRepository;

    @Override
    @Transactional(readOnly = true)
    public SupplierDashboardResponse getDashboardData(String supplierEmail) {
        User supplier = getActiveSupplierByEmail(supplierEmail);

        List<String> brandNames = supplierBrandRepository.findBySupplierId(supplier.getId())
                .stream()
                .map(mapping -> mapping.getBrand().getName())
                .toList();

        BigDecimal totalSales = orderItemRepository.calculateTotalSalesForSupplier(supplier.getId());
        if (totalSales == null) {
            totalSales = BigDecimal.ZERO;
        }

        int pendingRestocks = productRepository.countPendingRestocksForSupplier(supplier.getId());

        return SupplierDashboardResponse.builder()
                .brandNames(brandNames)
                .totalSales(totalSales)
                .pendingRestocks(pendingRestocks)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BrandResponse> getAssignedBrands(String supplierEmail) {
        User supplier = getActiveSupplierByEmail(supplierEmail);
        List<SupplierBrand> mappings = supplierBrandRepository.findBySupplierId(supplier.getId());

        return mappings.stream()
                .map(mapping -> BrandResponse.builder()
                        .id(mapping.getBrand().getId())
                        .name(mapping.getBrand().getName())
                        .code(mapping.getBrand().getCode())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierProductResponse> getSupplierProducts(String supplierEmail) {
        User supplier = getActiveSupplierByEmail(supplierEmail);
        List<Product> products = productRepository.findProductsForSupplier(supplier.getId());

        return products.stream()
                .map(product -> SupplierProductResponse.builder()
                        .id(product.getId())
                        .name(product.getName())
                        .category(product.getCategory())
                        .brandName(product.getBrand() != null ? product.getBrand().getName() : null)
                        .price(product.getPrice())
                        .unit(product.getUnit())
                        .stockQuantity(product.getStockQuantity())
                        .approvalStatus(product.getApprovalStatus() != null ? product.getApprovalStatus().name() : "APPROVED")
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public SupplierProductResponse requestNewProduct(String supplierEmail, ProductRequest request) {
        User supplier = getActiveSupplierByEmail(supplierEmail);
        
        if (request.getBrandId() == null) {
             throw new IllegalArgumentException("Brand ID is required for supplier product request.");
        }

        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new IllegalArgumentException("Brand not found."));

        supplierBrandRepository.findById(new SupplierBrandId(supplier.getId(), brand.getId()))
                .orElseThrow(() -> new IllegalArgumentException("You are not authorized to create products for this brand."));

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(request.getCategory())
                .brand(brand)
                .imageUrl(request.getImageUrl())
                .featured(false) // Suppliers should not choose featured by default
                .unit(request.getUnit())
                .expiryDate(request.getExpiryDate())
                .stockQuantity(request.getStockQuantity())
                .reorderThreshold(0)
                .approvalStatus(ApprovalStatus.PENDING)
                .build();

        Product savedProduct = productRepository.save(product);

        return SupplierProductResponse.builder()
                .id(savedProduct.getId())
                .name(savedProduct.getName())
                .category(savedProduct.getCategory())
                .brandName(brand.getName())
                .price(savedProduct.getPrice())
                .unit(savedProduct.getUnit())
                .stockQuantity(savedProduct.getStockQuantity())
                .approvalStatus(savedProduct.getApprovalStatus().name())
                .build();
    }

    private User getActiveSupplierByEmail(String supplierEmail) {
        return userRepository.findByEmailAndRoleAndIsActiveTrue(supplierEmail.toLowerCase().trim(), Role.SUPPLIER)
                .orElseThrow(SupplierInactiveException::new);
    }
}
