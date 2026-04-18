import api from './api';

/**
 * Fetches the complete inventory list from the admin API.
 *
 * @returns {Promise<InventoryResponse[]>} array of inventory entries
 */
export const getInventory = () =>
  api.get('/api/admin/inventory').then(res => res.data);

/**
 * Updates the stock quantity and reorder threshold for a specific product.
 *
 * @param {number} productId  ID of the product to update
 * @param {{ quantity: number, reorderThreshold: number }} data  update payload
 * @returns {Promise<InventoryResponse>} the updated inventory entry
 */
export const updateInventory = (productId, data) =>
  api.put(`/api/admin/inventory/${productId}`, data).then(res => res.data);

/**
 * Fetches all batches for a product ordered by expiry date ascending.
 *
 * @param {number} productId  product whose batches to retrieve
 * @returns {Promise<BatchResponse[]>} list of batches
 */
export const getProductBatches = (productId) =>
  api.get(`/api/admin/inventory/${productId}/batches`).then(res => res.data);
