import api from './api';

/**
 * Service Layer – Admin supplier management API calls.
 */

/**
 * Fetch all supplier accounts.
 *
 * @returns {Promise<Array>} supplier list
 */
export const getSuppliers = () => api.get('/api/admin/suppliers').then((res) => res.data);

/**
 * Fetch active brands for assignment forms.
 *
 * @returns {Promise<Array>} active brands
 */
export const getActiveBrands = () => api.get('/api/admin/brands').then((res) => res.data);

/**
 * Create a supplier account with brand assignment.
 *
 * @param {Object} payload create supplier payload
 * @returns {Promise<Object>} created supplier
 */
export const createSupplier = (payload) =>
  api.post('/api/admin/suppliers', payload).then((res) => res.data);

/**
 * Toggle supplier account status.
 *
 * @param {number} supplierId supplier user id
 * @param {boolean} isActive true to activate, false to deactivate
 * @returns {Promise<Object>} updated supplier
 */
export const updateSupplierStatus = (supplierId, isActive) =>
  api.patch(`/api/admin/suppliers/${supplierId}/status`, { isActive }).then((res) => res.data);
