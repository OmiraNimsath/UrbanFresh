import api from './api';

/**
 * Service Layer – Supplier-scoped API calls.
 */

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
