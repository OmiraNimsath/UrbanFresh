package com.urbanfresh.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Admin view of a single product.
 * Extends the public ProductResponse by exposing raw stockQuantity and
 * audit timestamps — fields that are intentionally hidden from customers.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminProductResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private String imageUrl;
    private boolean featured;
    private LocalDate expiryDate;

    /** Raw warehouse count — visible to admins only to support inventory management. */
    private int stockQuantity;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
