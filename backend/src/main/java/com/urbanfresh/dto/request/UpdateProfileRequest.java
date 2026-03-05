package com.urbanfresh.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

/**
 * Request Layer – DTO for PUT /api/profile.
 * Carries validated fields a customer wishes to update on their profile.
 * Email is intentionally excluded – it is the account identifier and cannot be changed here.
 */
@Getter
public class UpdateProfileRequest {

    /** Name is always required even when updating; prevents accidental blanking. */
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    /** Optional – null means "keep existing phone on file". */
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone must be 10–15 digits, optionally starting with +")
    private String phone;

    /** Optional – null means "keep existing address on file". */
    @Size(max = 300, message = "Address must not exceed 300 characters")
    private String address;
}
