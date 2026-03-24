import api from './api';

/**
 * Service Layer – Admin brand management API calls.
 */

/**
 * Returns active brands for assignment pickers.
 *
 * @returns {Promise<Array>} active brands
 */
export const getActiveBrands = () =>
  api.get('/api/admin/brands').then((res) => res.data);

/**
 * Returns all brands including inactive rows for management views.
 *
 * @returns {Promise<Array>} all brands
 */
export const getAllBrands = () =>
  api.get('/api/admin/brands/all').then((res) => res.data);

/**
 * Creates a new brand.
 *
 * @param {{name: string, code: string}} payload brand create payload
 * @returns {Promise<Object>} created brand
 */
export const createBrand = (payload) =>
  api.post('/api/admin/brands', payload).then((res) => res.data);

/**
 * Updates an existing brand.
 *
 * @param {number} brandId brand ID
 * @param {{name: string, code: string}} payload brand update payload
 * @returns {Promise<Object>} updated brand
 */
export const updateBrand = (brandId, payload) =>
  api.put(`/api/admin/brands/${brandId}`, payload).then((res) => res.data);

/**
 * Soft deletes a brand (marks as inactive).
 *
 * @param {number} brandId brand ID
 * @returns {Promise<void>}
 */
export const deleteBrand = (brandId) =>
  api.delete(`/api/admin/brands/${brandId}`).then((res) => res.data);
