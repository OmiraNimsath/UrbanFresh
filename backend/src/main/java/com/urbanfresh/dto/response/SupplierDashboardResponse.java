package com.urbanfresh.dto.response;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Carries supplier dashboard summary data.
 * Contains brand names, total historical sales, and pending restock metrics.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierDashboardResponse {
    
    /** The brand names or primary brand name associated with the supplier */
    private List<String> brandNames;
    
    /** Financial performance summary across all the supplier's products */
    private BigDecimal totalSales;
    
    /** Count of items where stock <= reorder threshold */
    private int pendingRestocks;
}
