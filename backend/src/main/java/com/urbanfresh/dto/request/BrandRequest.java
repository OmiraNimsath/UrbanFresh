package com.urbanfresh.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Validated payload for admin brand create and update operations.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BrandRequest {

    @NotBlank(message = "Brand name is required")
    @Size(max = 120, message = "Brand name must not exceed 120 characters")
    private String name;

    @NotBlank(message = "Brand code is required")
    @Size(max = 60, message = "Brand code must not exceed 60 characters")
    private String code;
}