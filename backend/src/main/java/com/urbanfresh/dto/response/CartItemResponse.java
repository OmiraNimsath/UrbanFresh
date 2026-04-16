package com.urbanfresh.dto.response;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Getter;

/**
 * DTO Layer – Represents a single item line in the cart response.
 * Uses live product price (not a snapshot) because the cart is pre-checkout.
 */
@Getter
@Builder
public class CartItemResponse {

    /** Cart item primary key — used by the client to target update/remove requests. */
    private Long cartItemId;

    private Long productId;
    private String productName;
    private String imageUrl;
    private BigDecimal unitPrice;

    /** Discount percentage (0-100) currently applied to this product; 0 means no discount. */
    private Integer productDiscountPercentage;

    /** Human-readable pricing unit (e.g. "PER_KG", "PER_ITEM"). */
    private String unit;

    private int quantity;
    private BigDecimal lineTotal;

    /** True when at least 1 unit is in stock. Used to flag out-of-stock items in the cart UI. */
    private boolean inStock;

    /** Available stock count — used by the cart UI to cap the quantity stepper. */
    private int stockQuantity;
}
