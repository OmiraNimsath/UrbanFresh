package com.urbanfresh.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Payload for toggling supplier account activation.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSupplierStatusRequest {

    @NotNull(message = "isActive is required")
    private Boolean isActive;
}
