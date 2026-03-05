package com.urbanfresh.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Validated request payload for creating or updating a product.
 * Used by both POST /api/admin/products and PUT /api/admin/products/{id}.
 */
@Getter
@Setter
@NoArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 150, message = "Product name must not exceed 150 characters")
    private String name;

    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    @Size(max = 80, message = "Category must not exceed 80 characters")
    private String category;

    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;

    /** Whether this product is promoted in the landing page featured section. */
    private boolean featured;

    /** Null for non-perishable products; must not be in the past when provided. */
    private LocalDate expiryDate;

    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity cannot be negative")
    private Integer stockQuantity;
}
