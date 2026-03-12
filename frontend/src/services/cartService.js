import api from './api';

/**
 * Service Layer – Cart API calls.
 * All endpoints require a valid CUSTOMER JWT (handled by api.js request interceptor).
 * Every write operation returns the full updated CartResponse so the caller
 * does not need a separate GET to stay in sync.
 */

/**
 * Fetch the current cart state for the authenticated customer.
 * Returns an empty cart (items: [], totalAmount: 0, itemCount: 0) when no cart exists.
 * @returns {Promise<CartResponse>}
 */
export const getCart = () =>
  api.get('/api/cart').then((res) => res.data);

/**
 * Add a product to the cart, or increment its quantity if already present.
 * @param {number} productId
 * @param {number} [quantity=1]
 * @returns {Promise<CartResponse>}
 */
export const addToCart = (productId, quantity = 1) =>
  api.post('/api/cart/items', { productId, quantity }).then((res) => res.data);

/**
 * Update the quantity of a specific cart item.
 * @param {number} cartItemId  - the cart item's primary key
 * @param {number} quantity    - new quantity (≥ 1)
 * @returns {Promise<CartResponse>}
 */
export const updateCartItem = (cartItemId, quantity) =>
  api.put(`/api/cart/items/${cartItemId}`, { quantity }).then((res) => res.data);

/**
 * Remove a single item from the cart.
 * @param {number} cartItemId
 * @returns {Promise<CartResponse>}
 */
export const removeCartItem = (cartItemId) =>
  api.delete(`/api/cart/items/${cartItemId}`).then((res) => res.data);

/**
 * Remove all items from the cart (called after a successful order placement).
 * @returns {Promise<void>}
 */
export const clearCart = () =>
  api.delete('/api/cart');
