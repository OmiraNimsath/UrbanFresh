package com.urbanfresh.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Layer – Paginated wrapper for a list of ProductResponse objects.
 * Returned by GET /api/products so the frontend can render pagination controls.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductPageResponse {

    private List<ProductResponse> products;

    /** Total number of products matching the current search/filter criteria. */
    private long totalElements;

    /** Total number of pages given the requested page size. */
    private int totalPages;

    /** Zero-based index of the currently returned page. */
    private int currentPage;

    /** Number of items per page used in this response. */
    private int pageSize;
}
