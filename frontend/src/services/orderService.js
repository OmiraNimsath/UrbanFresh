/**
 * Service Layer – API calls for customer order history and loyalty points.
 * All requests are authenticated via the Bearer token attached by the api.js interceptor.
 */

import api from './api';

/* ── Mock data for Figma design preview ── */
const MOCK_ORDERS = [
  { orderId: 1001, status: 'DELIVERED', paymentStatus: 'SUCCESS', totalAmount: 17.44, discountAmount: 0, pointsRedeemed: 0, deliveryAddress: '12 Green Lane, Colombo 05', createdAt: '2026-04-18T10:30:00', items: [{ productId: 101, productName: 'Organic Bananas', quantity: 2, unitPrice: 2.49, subtotal: 4.98 }, { productId: 102, productName: 'Fresh Spinach', quantity: 1, unitPrice: 1.99, subtotal: 1.99 }, { productId: 103, productName: 'Cherry Tomatoes', quantity: 3, unitPrice: 3.49, subtotal: 10.47 }] },
  { orderId: 1002, status: 'SHIPPED', paymentStatus: 'SUCCESS', totalAmount: 12.97, discountAmount: 2.50, pointsRedeemed: 50, deliveryAddress: '12 Green Lane, Colombo 05', createdAt: '2026-04-19T14:15:00', items: [{ productId: 104, productName: 'Red Apples', quantity: 2, unitPrice: 4.99, subtotal: 9.98 }, { productId: 105, productName: 'Avocado', quantity: 1, unitPrice: 2.99, subtotal: 2.99 }] },
  { orderId: 1003, status: 'PENDING', paymentStatus: 'PENDING', totalAmount: 8.47, discountAmount: 0, pointsRedeemed: 0, deliveryAddress: '12 Green Lane, Colombo 05', createdAt: '2026-04-21T09:00:00', items: [{ productId: 106, productName: 'Cucumber', quantity: 2, unitPrice: 1.49, subtotal: 2.98 }, { productId: 107, productName: 'Bell Peppers Mix', quantity: 1, unitPrice: 5.49, subtotal: 5.49 }] },
];
const MOCK_LOYALTY = { totalPoints: 240, earnedPoints: 290, redeemedPoints: 50, conversionRule: '1 point = Rs. 5 discount' };
const MOCK_RECOMMENDATIONS = [
  { productId: 101, productName: 'Organic Bananas', price: 2.49, unit: 'bunch', imageUrl: null, purchaseCount: 5 },
  { productId: 104, productName: 'Red Apples', price: 4.99, unit: 'kg', imageUrl: null, purchaseCount: 3 },
  { productId: 108, productName: 'Sweet Corn', price: 3.29, unit: '3 pack', imageUrl: null, purchaseCount: 2 },
];

/**
 * Place a new order for the authenticated customer.
 * POST /api/orders
 *
 * @param {string} deliveryAddress - confirmed delivery address
 * @param {Array<{productId: number, quantity: number}>} items - cart items to order
 * @param {number} [pointsToRedeem=0] - loyalty points to apply as discount (1 pt = Rs. 5)
 * @returns {Promise<OrderResponse>} created order with orderId, status, totalAmount, discountAmount, pointsRedeemed, items
 */
export const placeOrder = (deliveryAddress, items, pointsToRedeem = 0) =>
  Promise.resolve({ orderId: 1004, status: 'CONFIRMED', paymentStatus: 'SUCCESS', totalAmount: 17.44, discountAmount: pointsToRedeem * 5, pointsRedeemed: pointsToRedeem, deliveryAddress, createdAt: new Date().toISOString(), items: items.map((i, idx) => ({ productId: i.productId, productName: `Product ${idx + 1}`, quantity: i.quantity, unitPrice: 2.99, subtotal: i.quantity * 2.99 })) });

/**
 * Fetch the authenticated customer's order history, newest first.
 * GET /api/customer/orders
 *
 * @returns {Promise<OrderResponse[]>} list of orders; empty array when no orders exist
 */
export const getMyOrders = () => Promise.resolve(MOCK_ORDERS);

/**
 * Fetch up to 5 "Buy Again" product recommendations for the authenticated customer.
 * Ranked by purchase frequency; excludes hidden and out-of-stock products.
 * GET /api/customer/recommendations
 *
 * @returns {Promise<RecommendationResponse[]>} ordered recommendation list (empty when no history)
 */
export const getRecommendations = () => Promise.resolve(MOCK_RECOMMENDATIONS);

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
  Promise.resolve(MOCK_ORDERS.find((o) => String(o.orderId) === String(orderId)) ?? MOCK_ORDERS[0]);

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
  const found = normalizedId
    ? (MOCK_ORDERS.find((o) => String(o.orderId) === normalizedId) ?? MOCK_ORDERS[0])
    : MOCK_ORDERS[0];
  return { order: found, source: 'id', unauthorized: false };
};

/**
 * Fetch the authenticated customer's loyalty points summary.
 * GET /api/customer/loyalty
 *
 * @returns {Promise<LoyaltyPointsResponse>} totalPoints, earnedPoints, redeemedPoints, conversionRule
 */
export const getLoyaltyPoints = () => Promise.resolve(MOCK_LOYALTY);

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
 * Fetches paginated READY orders that are not assigned to any delivery person.
 * GET /api/delivery/orders/available?page={page}&size={size}
 *
 * @param {number} [page=0] zero-based page index
 * @param {number} [size=20] page size
 * @returns {Promise<{content: Array, totalElements: number, totalPages: number, number: number}>}
 */
export const getAvailableDeliveryOrders = (page = 0, size = 20) =>
	api.get('/api/delivery/orders/available', {
		params: { page, size },
		headers: {
			'Cache-Control': 'no-store',
			Pragma: 'no-cache',
		},
	}).then((res) => res.data);

/**
 * Accepts a READY unassigned order for the authenticated delivery user.
 * PATCH /api/delivery/orders/{orderId}/accept
 *
 * @param {number|string} orderId order ID
 * @returns {Promise<Object>} updated delivery order summary payload
 */
export const acceptDeliveryOrder = (orderId) =>
	api.patch(`/api/delivery/orders/${orderId}/accept`).then((res) => res.data);

/**
 * Updates the status of an order assigned to the authenticated delivery user.
 * PATCH /api/delivery/orders/{orderId}/status
 *
 * @param {number|string} orderId order ID
 * @param {string} status target status (DELIVERED or RETURNED)
 * @param {string | null} [changeReason] optional change reason
 * @returns {Promise<Object>} updated delivery order details payload
 */
export const updateAssignedDeliveryOrderStatus = (orderId, status, changeReason = null) =>
	api.patch(`/api/delivery/orders/${orderId}/status`, { status, changeReason }).then((res) => res.data);

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
