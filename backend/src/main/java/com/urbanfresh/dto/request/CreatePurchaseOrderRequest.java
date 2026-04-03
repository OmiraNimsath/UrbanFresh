package com.urbanfresh.dto.request;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload to create a new purchase order for a supplier's brand.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePurchaseOrderRequest {

    @NotNull(message = "Brand ID is required")
    private Long brandId;

    @NotEmpty(message = "Purchase order must contain at least one item")
    @Valid
    private List<CreatePurchaseOrderItemRequest> items;
}