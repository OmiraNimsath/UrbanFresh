package com.urbanfresh.service;

import com.urbanfresh.dto.request.AddToCartRequest;
import com.urbanfresh.dto.request.UpdateCartItemRequest;
import com.urbanfresh.dto.response.CartResponse;

/**
 * Service Layer – Contract for cart management operations.
 * All methods are scoped to the authenticated customer identified by their email.
 */
public interface CartService {

    /**
     * Retrieve the customer's current cart.
     * Returns an empty cart response when the customer has no cart yet.
     *
     * @param customerEmail email extracted from the JWT
     * @return current CartResponse with items and totals
     */
    CartResponse getCart(String customerEmail);

    /**
     * Add a product to the cart, or increment its quantity if it is already present.
     * Rejects products that are out of stock.
     *
     * @param customerEmail email extracted from the JWT
     * @param request       product ID and quantity to add
     * @return updated CartResponse after the addition
     */
    CartResponse addToCart(String customerEmail, AddToCartRequest request);

    /**
     * Update the quantity of an existing cart item.
     * Only the owning customer may update their own items.
     *
     * @param customerEmail email extracted from the JWT
     * @param cartItemId    ID of the cart item to update
     * @param request       new quantity
     * @return updated CartResponse after the change
     */
    CartResponse updateCartItem(String customerEmail, Long cartItemId, UpdateCartItemRequest request);

    /**
     * Remove a single item from the cart.
     * Only the owning customer may remove their own items.
     *
     * @param customerEmail email extracted from the JWT
     * @param cartItemId    ID of the cart item to remove
     * @return updated CartResponse after the removal
     */
    CartResponse removeCartItem(String customerEmail, Long cartItemId);

    /**
     * Remove all items from the customer's cart (e.g. after successful order placement).
     *
     * @param customerEmail email extracted from the JWT
     */
    void clearCart(String customerEmail);
}
