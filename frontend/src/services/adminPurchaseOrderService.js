import api from './api';

/**
 * Service Layer - Admin APIs for generating and viewing purchase orders
 */

/**
 * Get all purchase orders across all brands.
 * @returns {Promise<Array>} array of PurchaseOrderDto
 */
export const getAllPurchaseOrders = () => 
  api.get('/api/admin/purchase-orders').then((res) => res.data);

/**
 * Create a new purchase order
 * @param {Object} data format { brandId, items: [{ productId, quantity }] }
 * @returns {Promise<Object>} The created order
 */
export const createPurchaseOrder = (data) =>
  api.post('/api/admin/purchase-orders', data).then((res) => res.data);
/**
 * Confirm delivery and update inventory stock
 * @param {number} orderId Purchase order ID
 * @returns {Promise<Object>} The updated order
 */
export const confirmDeliveryAndStock = (orderId) =>
  api.put(`/api/admin/purchase-orders/${orderId}/confirm`).then((res) => res.data);