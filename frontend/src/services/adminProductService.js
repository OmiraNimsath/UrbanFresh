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
 * Applies or removes a near-expiry discount on a single product.
 * Calls PATCH /api/admin/products/{id}/discount
 *
 * Surgical update: only discountPercentage is written on the server.
 * All other product attributes (name, price, brand, description, imageUrl,
 * featured, unit, category, expiryDate, stockQuantity) are left untouched.
 * Use this from the Expiry Dashboard instead of updateProduct() to avoid
 * the full-replacement overwrite risk.
 *
 * @param {number} id                 - product ID
 * @param {number} discountPercentage - new discount value (0 = no discount, 1–100 = active)
 * @returns {Promise<Object>}         - AdminProductResponse with updated discountPercentage
 */
export const applyProductDiscount = (id, discountPercentage) =>
  api
    .patch(`/api/admin/products/${id}/discount`, { discountPercentage })
    .then((res) => res.data);

/**
 * Permanently deletes a product from the catalogue.
 * Calls DELETE /api/admin/products/{id}
 *
 * @param {number} id - product ID to delete
 * @returns {Promise<void>}
 */
export const deleteProduct = (id) =>
  api.delete(`/api/admin/products/${id}`).then((res) => res.data);

/**
 * Toggles the hidden flag on a product.
 * When hidden, the product is excluded from the customer catalogue.
 * Calls PATCH /api/admin/products/{id}/hide
 *
 * @param {number} id - product ID
 * @returns {Promise<object>} updated AdminProductResponse
 */
export const toggleHideProduct = (id) =>
  api.patch(`/api/admin/products/${id}/hide`).then((res) => res.data);

/**
 * Retrieves pending products for admin approval.
 */
export const getPendingProducts = (page = 0, size = 20) =>
  api.get('/api/admin/products/requests', { params: { page, size } }).then((res) => res.data);

/**
 * Approves a pending product.
 */
export const approveProduct = (id) =>
  api.patch(`/api/admin/products/${id}/approve`).then((res) => res.data);

/**
 * Rejects a pending product.
 */
export const rejectProduct = (id) =>
  api.patch(`/api/admin/products/${id}/reject`).then((res) => res.data);

/**
 * Uploads a product image to the server.

 * Calls POST /api/admin/products/upload-image  (multipart/form-data)
 *
 * @param {File} file - image file (JPG, PNG, or WebP; max 5 MB)
 * @returns {Promise<{url: string}>} object containing the public image URL
 */
export const uploadProductImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post('/api/admin/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
};
