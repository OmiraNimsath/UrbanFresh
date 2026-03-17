/**
 * Service Layer – API calls for customer order history and loyalty points.
 * All requests are authenticated via the Bearer token attached by the api.js interceptor.
 */

import api from './api';

/**
 * Place a new order for the authenticated customer.
 * POST /api/orders
 *
 * @param {string} deliveryAddress - confirmed delivery address
 * @param {Array<{productId: number, quantity: number}>} items - cart items to order
 * @returns {Promise<OrderResponse>} created order with orderId, status, totalAmount, items
 */
export const placeOrder = (deliveryAddress, items) =>
  api.post('/api/orders', { deliveryAddress, items }).then((res) => res.data);

/**
 * Fetch the authenticated customer's order history, newest first.
 * GET /api/customer/orders
 *
 * @returns {Promise<OrderResponse[]>} list of orders; empty array when no orders exist
 */
export const getMyOrders = () => api.get('/api/customer/orders');

/**
 * Fetch the authenticated customer's loyalty points summary.
 * GET /api/customer/loyalty
 *
 * @returns {Promise<LoyaltyPointsResponse>} totalPoints, earnedPoints, redeemedPoints, conversionRule
 */
export const getLoyaltyPoints = () => api.get('/api/customer/loyalty');

/**
 * Fetches a paginated list of all customer orders for admin operations.
 * GET /api/admin/orders?page={page}&size={size}
 *
 * @param {number} [page=0] zero-based page index
 * @param {number} [size=20] page size
 * @returns {Promise<{content: Array, totalElements: number, totalPages: number, number: number}>}
 */
export const getAllOrders = (page = 0, size = 20) =>
	api.get('/api/admin/orders', { params: { page, size } }).then((res) => res.data);

/**
 * Updates the lifecycle status of an order.
 * PATCH /api/admin/orders/{orderId}/status
 *
 * @param {number} orderId order ID
 * @param {string} status target order status
 * @param {string | null} [changeReason] optional reason for status correction actions
 * @returns {Promise<Object>} updated AdminOrderResponse
 */
export const updateOrderStatus = (orderId, status, changeReason = null) =>
	api.patch(`/api/admin/orders/${orderId}/status`, { status, changeReason }).then((res) => res.data);

/**
 * Fetches complete details for a single admin order review view.
 * GET /api/admin/orders/{orderId}
 *
 * @param {number} orderId order ID
 * @returns {Promise<Object>} full order review payload
 */
export const getOrderReview = (orderId) =>
	api.get(`/api/admin/orders/${orderId}`).then((res) => res.data);
