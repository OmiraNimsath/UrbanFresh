package com.urbanfresh.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urbanfresh.dto.response.BrandResponse;
import com.urbanfresh.dto.response.SupplierDashboardResponse;
import com.urbanfresh.dto.response.SupplierProductResponse;
import com.urbanfresh.exception.SupplierInactiveException;
import com.urbanfresh.model.Product;
import com.urbanfresh.model.Role;
import com.urbanfresh.model.SupplierBrand;
import com.urbanfresh.model.User;
import com.urbanfresh.repository.OrderItemRepository;
import com.urbanfresh.repository.ProductRepository;
import com.urbanfresh.repository.SupplierBrandRepository;
import com.urbanfresh.repository.UserRepository;
import com.urbanfresh.service.SupplierService;

import lombok.RequiredArgsConstructor;
import java.math.BigDecimal;

/**
 * Service Layer – Implements supplier-facing brand-scoped operations.
 */
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {

    private final UserRepository userRepository;
    private final SupplierBrandRepository supplierBrandRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;

    /**
     * Retrieves aggregated metrics for the supplier dashboard.
     *
     * @param supplierEmail authenticated supplier email
     * @return dashboard summary including brand names, sales, and restock counts
     */
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

    /**
     * Get all brands assigned to the authenticated supplier.
     *
     * @param supplierEmail authenticated supplier email
     * @return assigned brands
     */
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

    /**
     * Get products visible to the authenticated supplier.
     *
     * @param supplierEmail authenticated supplier email
     * @return brand-filtered products
     */
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
                        .build())
                .toList();
    }

    private User getActiveSupplierByEmail(String supplierEmail) {
        return userRepository.findByEmailAndRoleAndIsActiveTrue(supplierEmail.toLowerCase().trim(), Role.SUPPLIER)
                .orElseThrow(SupplierInactiveException::new);
    }
}
