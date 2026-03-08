/**
 * Service Layer – API calls for customer order history and loyalty points.
 * All requests are authenticated via the Bearer token attached by the api.js interceptor.
 */

import api from './api';

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
