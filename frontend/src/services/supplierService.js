import api from './api';

/**
 * Service Layer – Supplier-scoped API calls.
 */

/**
 * Retrieves dashboard summary for the supplier.
 * 
 * @returns {Promise<Object>} dashboard summary data
 */
export const getSupplierDashboard = () =>
  api.get('/api/supplier/dashboard').then((res) => res.data);

/**
 * Returns brands assigned to the authenticated supplier.
 *
 * @returns {Promise<Array>} array of BrandResponse
 */
export const getSupplierBrands = () =>
  api.get('/api/supplier/brands').then((res) => res.data);

/**
 * Returns products scoped to supplier assigned brands.
 *
 * @returns {Promise<Array>} array of SupplierProductResponse
 */
export const getSupplierProducts = () =>
  api.get('/api/supplier/products').then((res) => res.data);
