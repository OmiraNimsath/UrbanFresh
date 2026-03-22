/**
 * Service Layer – Axios calls for delivery personnel management endpoints.
 * Admin-only operations: create, list, activate/deactivate delivery personnel.
 * Centralizes all delivery personnel API interactions.
 */
import api from './api';

const DELIVERY_PATH = '/api/admin/delivery-personnel';

/**
 * Create a new delivery personnel account.
 * @param {object} data - { name, email, password, phone }
 * @returns {Promise} resolved with DeliveryPersonnelResponse on success
 * @throws axios error with response.data containing validation or business errors
 */
export const createDeliveryPersonnel = (data) =>
  api.post(DELIVERY_PATH, data);

/**
 * Retrieve paginated list of all delivery personnel.
 * @param {number} page - zero-based page index (default 0)
 * @param {number} size - items per page (default 20)
 * @returns {Promise} resolved with paginated Page<DeliveryPersonnelResponse>
 * @throws axios error if not admin or other server error
 */
export const getDeliveryPersonnelList = (page = 0, size = 20) =>
  api.get(DELIVERY_PATH, { params: { page, size } });

/**
 * Activate or deactivate a delivery personnel account.
 * @param {number} id - delivery personnel ID
 * @param {boolean} isActive - true to activate, false to deactivate
 * @returns {Promise} resolved with updated DeliveryPersonnelResponse
 * @throws axios error if not admin or delivery personnel not found
 */
export const updateDeliveryPersonnelStatus = (id, isActive) =>
  api.patch(`${DELIVERY_PATH}/${id}/status`, { isActive });
