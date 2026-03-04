/**
 * Service Layer – API calls for product data used by the public landing page.
 * Uses the shared Axios instance so auth headers are attached automatically
 * when a token exists, but these endpoints work without one too.
 */
import api from './api';

/**
 * Fetches all products flagged as featured.
 * Calls GET /api/products/featured (public endpoint).
 *
 * @returns {Promise<Array>} array of ProductResponse objects
 */
export const getFeaturedProducts = () =>
  api.get('/api/products/featured').then((res) => res.data);

/**
 * Fetches in-stock products expiring within the given look-ahead window.
 * Calls GET /api/products/near-expiry?days={days} (public endpoint).
 *
 * @param {number} days - look-ahead window in days (default 7)
 * @returns {Promise<Array>} array of ProductResponse objects ordered by earliest expiry
 */
export const getNearExpiryProducts = (days = 7) =>
  api.get('/api/products/near-expiry', { params: { days } }).then((res) => res.data);
