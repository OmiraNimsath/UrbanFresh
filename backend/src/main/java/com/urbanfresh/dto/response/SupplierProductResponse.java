package com.urbanfresh.dto.response;

import java.math.BigDecimal;

import com.urbanfresh.model.PricingUnit;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Product payload exposed to supplier dashboards.
 */
@Getter
@Builder
public class SupplierProductResponse {

    private Long id;
    private String name;
    private String category;
    private String brandName;
    private BigDecimal price;
    private PricingUnit unit;
    private Integer stockQuantity;
    private Integer reorderThreshold;
    private String approvalStatus;
}
