package com.urbanfresh.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.urbanfresh.dto.request.CreateDeliveryPersonnelRequest;
import com.urbanfresh.dto.request.CreateSupplierRequest;
import com.urbanfresh.dto.request.UpdateDeliveryPersonnelStatusRequest;
import com.urbanfresh.dto.request.UpdateSupplierStatusRequest;
import com.urbanfresh.dto.response.AdminStatsResponse;
import com.urbanfresh.dto.response.BrandResponse;
import com.urbanfresh.dto.response.DeliveryPersonnelResponse;
import com.urbanfresh.dto.response.SupplierResponse;

/**
 * Service Layer – Defines admin-specific business operations.
 * Callers must hold ADMIN role; enforced by SecurityConfig URL rules and
 * @PreAuthorize in AdminController before this layer is reached.
 */
public interface AdminService {

    /**
     * Retrieve high-level platform statistics for the admin dashboard.
     *
     * @return aggregated counts of users and products
     */
    AdminStatsResponse getStats();

    /**
     * Create a new delivery personnel account with DELIVERY role.
     * Validates unique email, hashes the password, and sets isActive = true.
     *
     * @param request validated delivery personnel data
     * @return response with the created personnel's info
     * @throws com.urbanfresh.exception.DuplicateEmailException if email is taken
     */
    DeliveryPersonnelResponse createDeliveryPersonnel(CreateDeliveryPersonnelRequest request);

    /**
     * Retrieve all delivery personnel (paginated) for admin management.
     *
     * @param pageable pagination parameters (page, size, sort)
     * @return page of delivery personnel
     */
    Page<DeliveryPersonnelResponse> getDeliveryPersonnel(Pageable pageable);

    /**
     * Activate or deactivate a delivery personnel account.
     * When deactivated, the user cannot log in.
     *
     * @param deliveryPersonnelId unique identifier of the delivery personnel
     * @param request contains isActive flag (true = activate, false = deactivate)
     * @return updated delivery personnel response
     * @throws com.urbanfresh.exception.UserNotFoundException if delivery personnel not found
     */
    DeliveryPersonnelResponse updateDeliveryPersonnelStatus(Long deliveryPersonnelId, UpdateDeliveryPersonnelStatusRequest request);

    /**
     * Create a new supplier account and assign one or more brands.
     *
     * @param request validated supplier creation payload
     * @return created supplier account and assigned brands
     */
    SupplierResponse createSupplier(CreateSupplierRequest request);

    /**
     * Retrieve all supplier accounts (sorted by name) for admin management.
     *
     * @return list of suppliers with assigned brands
     */
    List<SupplierResponse> getSuppliers();

    /**
     * Activate or deactivate a supplier account.
     *
     * @param supplierId supplier account ID
     * @param request activation payload
     * @return updated supplier response
     */
    SupplierResponse updateSupplierStatus(Long supplierId, UpdateSupplierStatusRequest request);

    /**
     * Retrieve assignable active brands for admin forms.
     *
     * @return list of active brands
     */
    List<BrandResponse> getActiveBrands();
}
