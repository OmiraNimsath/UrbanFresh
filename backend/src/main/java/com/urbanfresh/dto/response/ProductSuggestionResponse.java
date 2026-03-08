package com.urbanfresh.dto.response;

import java.math.BigDecimal;

import com.urbanfresh.model.PricingUnit;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * DTO Layer – Minimal product payload for the autocomplete suggestions endpoint.
 * Contains only the fields needed to render a suggestion preview row in the UI:
 * identity, display name, thumbnail image URL, and price with unit.
 * Intentionally lighter than {@link ProductResponse} — keeps the suggestions
 * response payload small so the dropdown stays fast.
 *
 * The all-args constructor is required by the JPQL {@code NEW} expression used
 * in {@link com.urbanfresh.repository.ProductRepository#findNameSuggestions}.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ProductSuggestionResponse {

    private Long id;
    private String name;

    /** May be null for products without an uploaded image. */
    private String imageUrl;

    private BigDecimal price;
    private PricingUnit unit;
}
