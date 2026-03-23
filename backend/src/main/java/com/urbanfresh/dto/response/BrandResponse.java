package com.urbanfresh.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Lightweight brand payload for assignment and supplier views.
 */
@Getter
@Builder
public class BrandResponse {

    private Long id;
    private String name;
    private String code;
}
