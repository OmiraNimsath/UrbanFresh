package com.urbanfresh.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.urbanfresh.dto.request.BrandRequest;
import com.urbanfresh.dto.request.CreateSupplierRequest;
import com.urbanfresh.dto.request.OrderStatusUpdateRequest;
import com.urbanfresh.dto.request.ProductRequest;
import com.urbanfresh.dto.request.UpdateSupplierRequest;
import com.urbanfresh.dto.request.UpdateSupplierStatusRequest;
import com.urbanfresh.dto.response.AdminOrderResponse;
import com.urbanfresh.dto.response.AdminOrderReviewResponse;
import com.urbanfresh.dto.response.AdminProductResponse;
import com.urbanfresh.dto.response.AdminStatsResponse;
import com.urbanfresh.dto.response.BrandResponse;
import com.urbanfresh.dto.response.SupplierResponse;
import com.urbanfresh.service.AdminProductService;
import com.urbanfresh.service.AdminService;
import com.urbanfresh.service.OrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller Layer – ADMIN-only endpoints for platform management.
 * Protected by two independent layers:
 *   1. URL-level:    SecurityConfig restricts /api/admin/** to ROLE_ADMIN.
 *   2. Method-level: @PreAuthorize is defence-in-depth if URL rules are
 *                    misconfigured or bypassed.
 * Any valid JWT without ADMIN role receives 403 via RoleAccessDeniedHandler
 * (URL layer) or GlobalExceptionHandler (method layer).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private static final List<String> ALLOWED_TYPES =
            List.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    private final AdminService adminService;
    private final AdminProductService adminProductService;
    private final OrderService orderService;

    /**
     * Returns high-level platform statistics for the admin dashboard.
     * GET /api/admin/stats
     *
     * @return 200 OK with totalUsers and totalProducts counts
     */
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    /**
     * Returns a paginated list of all customer orders for admin management.
     * GET /api/admin/orders?page=0&size=20
     *
     * @param page zero-based page index (default 0)
     * @param size items per page (default 20, clamped to 1–100)
     * @return 200 OK with page of AdminOrderResponse
     */
    @GetMapping("/orders")
    public ResponseEntity<Page<AdminOrderResponse>> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(orderService.getAllOrdersForAdmin(page, size));
    }

    /**
     * Returns complete details for a single order review.
     * GET /api/admin/orders/{orderId}
     *
     * @param orderId order ID to review
     * @return 200 OK with AdminOrderReviewResponse
     */
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<AdminOrderReviewResponse> getOrderReview(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getOrderReviewForAdmin(orderId));
    }

    /**
     * Updates the lifecycle status of a specific order.
     * PATCH /api/admin/orders/{orderId}/status
     *
     * @param orderId order ID to update
     * @param authentication authenticated admin principal
     * @param request validated status update payload
     * @return 200 OK with updated AdminOrderResponse
     */
    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<AdminOrderResponse> updateOrderStatus(
            @PathVariable Long orderId,
            Authentication authentication,
            @Valid @RequestBody OrderStatusUpdateRequest request) {

        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, request, authentication.getName()));
    }

    // ── Product CRUD ───────────────────────────────────────────────────────────

    /**
     * Returns a paginated list of all products for the admin product table.
     * GET /api/admin/products?page=0&size=20
     *
     * @param page zero-based page index (default 0)
     * @param size items per page (default 20, clamped to 1–100)
     * @return 200 OK with page of AdminProductResponse
     */
    @GetMapping("/products")
    public ResponseEntity<Page<AdminProductResponse>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        int safeSize = Math.max(1, Math.min(size, 100));
        int safePage = Math.max(0, page);
        return ResponseEntity.ok(adminProductService.getProducts(safePage, safeSize));
    }

    /**
     * Returns a single product by ID.
     * GET /api/admin/products/{id}
     *
     * @param id product ID
     * @return 200 OK with AdminProductResponse; 404 if not found
     */
    @GetMapping("/products/{id}")
    public ResponseEntity<AdminProductResponse> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(adminProductService.getProductById(id));
    }

    /**
     * Creates a new product and adds it to the catalogue immediately.
     * POST /api/admin/products
     *
     * @param request validated product payload
     * @return 201 Created with the persisted AdminProductResponse
     */
    @PostMapping("/products")
    public ResponseEntity<AdminProductResponse> createProduct(
            @Valid @RequestBody ProductRequest request) {

        AdminProductResponse created = adminProductService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Replaces all editable fields of an existing product (full update).
     * PUT /api/admin/products/{id}
     *
     * @param id      product ID to update
     * @param request validated product payload with new values
     * @return 200 OK with updated AdminProductResponse; 404 if not found
     */
    @PutMapping("/products/{id}")
    public ResponseEntity<AdminProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {

        return ResponseEntity.ok(adminProductService.updateProduct(id, request));
    }

    /**
     * Permanently deletes a product from the catalogue.
     * DELETE /api/admin/products/{id}
     *
     * @param id product ID to delete
     * @return 204 No Content on success; 404 if not found
     */
    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        adminProductService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    // ── Delivery Personnel Management ──────────────────────────────────────

    /**
     * Create a new delivery personnel account.
     * POST /api/admin/delivery-personnel
     *
     * @param request validated delivery personnel creation payload
     * @return 201 Created with the created delivery personnel info
     */
    @PostMapping("/delivery-personnel")
    public ResponseEntity<com.urbanfresh.dto.response.DeliveryPersonnelResponse> createDeliveryPersonnel(
            @Valid @RequestBody com.urbanfresh.dto.request.CreateDeliveryPersonnelRequest request) {
        var response = adminService.createDeliveryPersonnel(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieve all delivery personnel (paginated) for admin management.
     * GET /api/admin/delivery-personnel?page=0&size=20
     *
     * @param page zero-based page index (default 0)
     * @param size items per page (default 20, clamped to 1–100)
     * @return 200 OK with page of DeliveryPersonnelResponse
     */
    @GetMapping("/delivery-personnel")
    public ResponseEntity<Page<com.urbanfresh.dto.response.DeliveryPersonnelResponse>> getDeliveryPersonnel(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        int safeSize = Math.max(1, Math.min(size, 100));
        int safePage = Math.max(0, page);
        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(safePage, safeSize);
        return ResponseEntity.ok(adminService.getDeliveryPersonnel(pageable));
    }

    /**
     * Activate or deactivate a delivery personnel account.
     * PATCH /api/admin/delivery-personnel/{id}/status
     *
     * @param deliveryPersonnelId delivery personnel ID
     * @param request contains isActive flag (true=activate, false=deactivate)
     * @return 200 OK with updated DeliveryPersonnelResponse
     */
    @PatchMapping("/delivery-personnel/{id}/status")
    public ResponseEntity<com.urbanfresh.dto.response.DeliveryPersonnelResponse> updateDeliveryPersonnelStatus(
            @PathVariable("id") Long deliveryPersonnelId,
            @Valid @RequestBody com.urbanfresh.dto.request.UpdateDeliveryPersonnelStatusRequest request) {
        var response = adminService.updateDeliveryPersonnelStatus(deliveryPersonnelId, request);
        return ResponseEntity.ok(response);
    }

    // ── Supplier Management ────────────────────────────────────────────────

    /**
     * Create a new supplier account with one or more assigned brands.
     * POST /api/admin/suppliers
     *
     * @param request validated supplier creation payload
     * @return 201 Created with SupplierResponse
     */
    @PostMapping("/suppliers")
    public ResponseEntity<SupplierResponse> createSupplier(@Valid @RequestBody CreateSupplierRequest request) {
        SupplierResponse response = adminService.createSupplier(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieve all suppliers for admin management.
     * GET /api/admin/suppliers
     *
     * @return 200 OK with list of SupplierResponse
     */
    @GetMapping("/suppliers")
    public ResponseEntity<List<SupplierResponse>> getSuppliers() {
        return ResponseEntity.ok(adminService.getSuppliers());
    }

    /**
     * Activate or deactivate supplier access.
     * PATCH /api/admin/suppliers/{id}/status
     *
     * @param supplierId supplier user ID
     * @param request activation payload
     * @return 200 OK with updated SupplierResponse
     */
    @PatchMapping("/suppliers/{id}/status")
    public ResponseEntity<SupplierResponse> updateSupplierStatus(
            @PathVariable("id") Long supplierId,
            @Valid @RequestBody UpdateSupplierStatusRequest request) {
        return ResponseEntity.ok(adminService.updateSupplierStatus(supplierId, request));
    }

    /**
     * Update supplier profile and assigned brands.
     * PUT /api/admin/suppliers/{id}
     *
     * @param supplierId supplier user ID
     * @param request validated update payload
     * @return 200 OK with updated SupplierResponse
     */
    @PutMapping("/suppliers/{id}")
    public ResponseEntity<SupplierResponse> updateSupplier(
            @PathVariable("id") Long supplierId,
            @Valid @RequestBody UpdateSupplierRequest request) {
        return ResponseEntity.ok(adminService.updateSupplier(supplierId, request));
    }

    /**
     * Returns active brands for supplier assignment forms.
     * GET /api/admin/brands
     *
     * @return 200 OK with list of active brands
     */
    @GetMapping("/brands")
    public ResponseEntity<List<BrandResponse>> getActiveBrands() {
        return ResponseEntity.ok(adminService.getActiveBrands());
    }

    /**
     * Returns all brands for admin brand management.
     * GET /api/admin/brands/all
     *
     * @return 200 OK with all brands list
     */
    @GetMapping("/brands/all")
    public ResponseEntity<List<BrandResponse>> getAllBrands() {
        return ResponseEntity.ok(adminService.getAllBrands());
    }

    /**
     * Create a new brand.
     * POST /api/admin/brands
     *
     * @param request validated brand payload
     * @return 201 Created with BrandResponse
     */
    @PostMapping("/brands")
    public ResponseEntity<BrandResponse> createBrand(@Valid @RequestBody BrandRequest request) {
        BrandResponse response = adminService.createBrand(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update an existing brand.
     * PUT /api/admin/brands/{id}
     *
     * @param brandId brand ID
     * @param request validated brand payload
     * @return 200 OK with updated BrandResponse
     */
    @PutMapping("/brands/{id}")
    public ResponseEntity<BrandResponse> updateBrand(
            @PathVariable("id") Long brandId,
            @Valid @RequestBody BrandRequest request) {
        return ResponseEntity.ok(adminService.updateBrand(brandId, request));
    }

    /**
     * Soft delete a brand by deactivation.
     * DELETE /api/admin/brands/{id}
     *
     * @param brandId brand ID
     * @return 204 No Content
     */
    @DeleteMapping("/brands/{id}")
    public ResponseEntity<Void> deleteBrand(@PathVariable("id") Long brandId) {
        adminService.deleteBrand(brandId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Uploads a product image and returns its public URL.
     * POST /api/admin/products/upload-image  (multipart/form-data, field = "file")
     *
     * Accepted formats: JPG, PNG, WebP — max 5 MB.
     *
     * @param file uploaded image
     * @return 200 OK { "url": "<public URL>" } or 400 with { "error": "..." }
     */
    @PostMapping(value = "/products/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadProductImage(
            @RequestParam("file") MultipartFile file) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file provided."));
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            return ResponseEntity.badRequest().body(Map.of("error", "File exceeds the 5 MB limit."));
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Unsupported file type. Use JPG, PNG, or WebP."));
        }

        String ext = switch (contentType) {
            case "image/png"  -> ".png";
            case "image/webp" -> ".webp";
            default           -> ".jpg";
        };

        String filename = UUID.randomUUID() + ext;
        Path destDir = Paths.get(uploadDir, "products");
        Files.createDirectories(destDir);
        Files.copy(file.getInputStream(), destDir.resolve(filename),
                StandardCopyOption.REPLACE_EXISTING);

        return ResponseEntity.ok(Map.of("url", baseUrl + "/uploads/products/" + filename));
    }
}

