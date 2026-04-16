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
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.urbanfresh.dto.request.ProductRequest;
import com.urbanfresh.dto.response.BrandResponse;
import com.urbanfresh.dto.response.SupplierDashboardResponse;
import com.urbanfresh.dto.response.SupplierProductResponse;
import com.urbanfresh.service.SupplierService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller Layer – Supplier-only endpoints for scoped dashboard data.
 */
@RestController
@RequestMapping("/api/supplier")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPPLIER')")
public class SupplierController {

    private static final List<String> ALLOWED_TYPES =
            List.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    private final SupplierService supplierService;

    /**
     * Retrieves aggregated metrics for the supplier dashboard.
     *
     * @param authentication authenticated supplier principal
     * @return dashboard summary including brand names, sales, and restock counts
     */
    @GetMapping("/dashboard")
    public ResponseEntity<SupplierDashboardResponse> getDashboardData(Authentication authentication) {
        return ResponseEntity.ok(supplierService.getDashboardData(authentication.getName()));
    }

    /**
     * Returns brands assigned to the authenticated supplier.
     *
     * @param authentication authenticated supplier principal
     * @return assigned brands list
     */
    @GetMapping("/brands")
    public ResponseEntity<List<BrandResponse>> getAssignedBrands(Authentication authentication) {
        return ResponseEntity.ok(supplierService.getAssignedBrands(authentication.getName()));
    }

    /**
     * Returns products scoped to the authenticated supplier's assigned brands.
     *
     * @param authentication authenticated supplier principal
     * @return supplier product list
     */
    @GetMapping("/products")
    public ResponseEntity<List<SupplierProductResponse>> getSupplierProducts(Authentication authentication) {
        return ResponseEntity.ok(supplierService.getSupplierProducts(authentication.getName()));
    }

    /**
     * Submits a request for a new product for a specific brand.
     *
     * @param request        product details including brandId
     * @param authentication authenticated supplier principal
     * @return the created product with PENDING status
     */
    @PostMapping("/products")
    public ResponseEntity<SupplierProductResponse> requestNewProduct(
            @Valid @RequestBody ProductRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(supplierService.requestNewProduct(authentication.getName(), request));
    }

    /**
     * Uploads a product image and returns its public URL.
     * POST /api/supplier/products/upload-image  (multipart/form-data, field = "file")
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
