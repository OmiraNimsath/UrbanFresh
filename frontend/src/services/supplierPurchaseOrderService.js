import api from './api';

/**
 * Service Layer - Handles API calls related to supplier purchase orders.
 */

/**
 * Retrieves all purchase orders mapped to the authenticated supplier's brands.
 *
 * @returns {Promise<Array>} array of PurchaseOrderDto
 */
export const getPurchaseOrders = () => 
  api.get('/api/supplier/purchase-orders').then((res) => res.data);

/**
 * Updates the shipment status and estimated delivery timeline of a purchase order.
 *
 * @param {number} orderId the ID of the purchase order
 * @param {Object} updateData payload containing status and estimated delivery timeline
 * @returns {Promise<Object>} the updated purchase order
 */
export const updatePurchaseOrderStatus = (orderId, updateData) => 
  api.patch(`/api/supplier/purchase-orders/${orderId}/status`, updateData).then((res) => res.data);