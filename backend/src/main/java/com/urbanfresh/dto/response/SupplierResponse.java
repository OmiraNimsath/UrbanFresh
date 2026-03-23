package com.urbanfresh.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Supplier account payload for admin management screens.
 */
@Getter
@Builder
public class SupplierResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private List<BrandResponse> brands;
}
