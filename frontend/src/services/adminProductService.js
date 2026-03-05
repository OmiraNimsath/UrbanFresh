/**
 * Service Layer – API calls for admin product management.
 * Wraps all CRUD operations against /api/admin/products.
 * Uses the shared Axios instance so the JWT Authorization header
 * is attached automatically on every request.
 */
import api from './api';

/**
 * Fetches a paginated list of all products for the admin product table.
 * Calls GET /api/admin/products?page={page}&size={size}
 *
 * @param {number} [page=0]  - zero-based page index
 * @param {number} [size=20] - items per page
 * @returns {Promise<{content: Array, totalElements: number, totalPages: number, number: number}>}
 */
export const getAdminProducts = (page = 0, size = 20) =>
  api.get('/api/admin/products', { params: { page, size } }).then((res) => res.data);

/**
 * Fetches a single product by ID.
 * Calls GET /api/admin/products/{id}
 *
 * @param {number} id - product ID
 * @returns {Promise<Object>} AdminProductResponse
 */
export const getAdminProduct = (id) =>
  api.get(`/api/admin/products/${id}`).then((res) => res.data);

/**
 * Creates a new product in the catalogue.
 * Calls POST /api/admin/products
 *
 * @param {Object} data - product payload (name, price, stockQuantity required)
 * @returns {Promise<Object>} AdminProductResponse for the created product
 */
export const createProduct = (data) =>
  api.post('/api/admin/products', data).then((res) => res.data);

/**
 * Replaces all editable fields of an existing product.
 * Calls PUT /api/admin/products/{id}
 *
 * @param {number} id   - product ID to update
 * @param {Object} data - full product payload with new values
 * @returns {Promise<Object>} AdminProductResponse after update
 */
export const updateProduct = (id, data) =>
  api.put(`/api/admin/products/${id}`, data).then((res) => res.data);

/**
 * Permanently deletes a product from the catalogue.
 * Calls DELETE /api/admin/products/{id}
 *
 * @param {number} id - product ID to delete
 * @returns {Promise<void>}
 */
export const deleteProduct = (id) =>
  api.delete(`/api/admin/products/${id}`).then((res) => res.data);
