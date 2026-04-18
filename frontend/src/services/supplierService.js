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

/**
 * Submits a request for a new product for a specific brand.
 *
 * @param {Object} productData product details including brandId
 * @returns {Promise<Object>} the created product with PENDING status
 */
export const requestNewProduct = (productData) =>
  api.post('/api/supplier/products', productData).then((res) => res.data);

/**
 * Uploads a product image via the supplier endpoint and returns its public URL.
 * Calls POST /api/supplier/products/upload-image  (multipart/form-data)
 *
 * @param {File} file - image file (JPG, PNG, or WebP; max 5 MB)
 * @returns {Promise<{url: string}>} object containing the public image URL
 */
export const uploadSupplierProductImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post('/api/supplier/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
};
