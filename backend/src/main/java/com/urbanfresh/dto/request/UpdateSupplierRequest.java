package com.urbanfresh.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Validated payload for updating supplier profile and brand assignments.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSupplierRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Pattern(regexp = "^$|^\\d{10,15}$", message = "Phone must be 10–15 digits")
    private String phone;

    @NotEmpty(message = "At least one brand must be assigned")
    private List<@NotNull(message = "Brand ID cannot be null") Long> brandIds;
}