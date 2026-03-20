package com.urbanfresh.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Carries an admin order status update request payload.
 * Layer: DTO
 */
@Getter
@Setter
@NoArgsConstructor
public class OrderStatusUpdateRequest {

    @NotBlank(message = "status is required")
    private String status;

    @Size(max = 255, message = "changeReason must be at most 255 characters")
    private String changeReason;
}
