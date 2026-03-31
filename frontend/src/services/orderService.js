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
 * Fetch one authenticated customer's order by ID.
 * Primary path for order-success page rehydration after refresh.
 *
 * Note: if backend has not exposed this endpoint yet, callers should
 * gracefully fallback to getMyOrders().
 *
 * GET /api/customer/orders/{orderId}
 *
 * @param {number|string} orderId
 * @returns {Promise<Object>} OrderResponse
 */
export const getMyOrderById = (orderId) =>
	api.get(`/api/customer/orders/${orderId}`, {
		headers: {
			'Cache-Control': 'no-store',
			Pragma: 'no-cache',
		},
	}).then((res) => res.data);

/**
 * Resolve order details for /order-success with robust fallback rules:
 * 1) Try dedicated by-id endpoint first (if an orderId exists).
 * 2) If unavailable/not found, fallback to customer order history.
 * 3) If no orderId provided, return latest order from history.
 *
 * @param {{ orderId?: number|string|null }} params
 * @returns {Promise<{order: Object|null, source: 'id'|'history'|'latest'|'none', unauthorized: boolean}>}
 */
export const resolveOrderForSuccess = async ({ orderId } = {}) => {
	const normalizedId = orderId ? String(orderId) : null;

	if (normalizedId) {
		try {
			const order = await getMyOrderById(normalizedId);
			return { order, source: 'id', unauthorized: false };
		} catch (error) {
			if (error?.response?.status === 403) {
				return { order: null, source: 'none', unauthorized: true };
			}
		}
	}

	const historyResponse = await api.get('/api/customer/orders', {
		headers: {
			'Cache-Control': 'no-store',
			Pragma: 'no-cache',
		},
	});
	const orders = Array.isArray(historyResponse?.data) ? historyResponse.data : [];

	if (normalizedId) {
		const matchedOrder = orders.find((order) => String(order?.orderId) === normalizedId);
		return {
			order: matchedOrder ?? null,
			source: matchedOrder ? 'history' : 'none',
			unauthorized: false,
		};
	}

	if (orders.length === 0) {
		return { order: null, source: 'none', unauthorized: false };
	}

	return { order: orders[0], source: 'latest', unauthorized: false };
};

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

/**
 * Fetch delivery details for an order assigned to the authenticated delivery user.
 * GET /api/delivery/orders/{orderId}
 *
 * @param {number|string} orderId order ID
 * @returns {Promise<Object>} delivery details payload with address, items, and status
 */
export const getDeliveryOrderById = (orderId) =>
	api.get(`/api/delivery/orders/${orderId}`, {
		headers: {
			'Cache-Control': 'no-store',
			Pragma: 'no-cache',
		},
	}).then((res) => res.data);

/**
 * Fetches paginated orders assigned to the authenticated delivery user.
 * GET /api/delivery/orders?page={page}&size={size}
 *
 * @param {number} [page=0] zero-based page index
 * @param {number} [size=20] page size
 * @returns {Promise<{content: Array, totalElements: number, totalPages: number, number: number}>}
 */
export const getAssignedDeliveryOrders = (page = 0, size = 20) =>
	api.get('/api/delivery/orders', {
		params: { page, size },
		headers: {
			'Cache-Control': 'no-store',
			Pragma: 'no-cache',
		},
	}).then((res) => res.data);

/**
 * Assigns or reassigns an active delivery person.
 * READY orders transition to OUT_FOR_DELIVERY.
 * PUT /api/admin/orders/{orderId}/assign-delivery
 *
 * @param {number} orderId target order ID (must be READY)
 * @param {number} deliveryPersonId active delivery personnel user ID
 * @returns {Promise<Object>} updated AdminOrderResponse with delivery person info
 */
export const assignDeliveryPersonnel = (orderId, deliveryPersonId) =>
	api.put(`/api/admin/orders/${orderId}/assign-delivery`, { deliveryPersonId }).then((res) => res.data);

/**
 * Fetches all active delivery personnel for the assignment dropdown.
 * GET /api/admin/delivery-personnel/active
 *
 * @returns {Promise<Array>} list of active DeliveryPersonnelResponse objects
 */
export const getActiveDeliveryPersonnel = () =>
	api.get('/api/admin/delivery-personnel/active').then((res) => res.data);
