/**
 * Service Layer – API calls for product data.
 * Covers the public landing page endpoints and the product listing/search page.
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

/**
 * Searches and filters the product catalogue with optional pagination.
 * Calls GET /api/products (public endpoint).
 *
 * @param {Object} params
 * @param {string} [params.search]   - substring to match in name/description
 * @param {string} [params.category] - category to filter by
 * @param {string} [params.sortBy]   - "price_asc" | "price_desc" | omit for name A–Z
 * @param {number} [params.page=0]   - zero-based page index
 * @param {number} [params.size=12]  - items per page
 * @returns {Promise<ProductPageResponse>} paginated result
 */
export const getProducts = ({ search, category, sortBy, page = 0, size = 12 } = {}) =>
  api.get('/api/products', { params: { search, category, sortBy, page, size } })
    .then((res) => res.data);

/**
 * Fetches all distinct category names for the filter dropdown.
 * Calls GET /api/products/categories (public endpoint).
 *
 * @returns {Promise<Array<string>>} sorted list of category strings
 */
export const getCategories = () =>
  api.get('/api/products/categories').then((res) => res.data);

/**
 * Fetches the full details of a single product by ID.
 * Calls GET /api/products/{id} (public endpoint).
 * Rejects with an Axios error (status 404) when the product does not exist.
 *
 * @param {number|string} id - product primary key
 * @returns {Promise<Object>} ProductResponse object
 */
export const getProductById = (id) =>
  api.get(`/api/products/${id}`).then((res) => res.data);

/**
 * Fetches up to 8 product name suggestions for the search autocomplete dropdown.
 * Calls GET /api/products/suggestions?q={query} (public endpoint).
 * This is intentionally separate from getProducts so typing in the search box
 * never triggers the heavier paginated catalogue fetch.
 *
 * @param {string} query - partial product name (min 2 chars; service silently returns [] otherwise)
 * @returns {Promise<string[]>} array of matching product name strings
 */
export const getProductSuggestions = (query) =>
  api.get('/api/products/suggestions', { params: { q: query } }).then((res) => res.data);
