/**
 * Service Layer – API calls for authenticated profile management.
 * All requests are authenticated via the Bearer token attached by the api.js interceptor.
 */

import api from './api';

/**
 * Fetch the authenticated user's profile.
 * GET /api/profile
 *
 * @returns {Promise<ProfileResponse>} profile data (id, name, email, phone, address, role)
 */
export const getProfile = () => api.get('/api/profile');

/**
 * Update the authenticated user's profile.
 * PUT /api/profile
 *
 * @param {{ name: string, phone?: string, address?: string }} data - fields to update
 * @returns {Promise<ProfileResponse>} updated profile data
 */
export const updateProfile = (data) => api.put('/api/profile', data);

/**
 * Fetch delivery profile summary counters for the authenticated delivery user.
 * GET /api/delivery/profile/summary
 *
 * @returns {Promise<{assignedOrderCount:number,outForDeliveryCount:number,deliveredCount:number,returnedCount:number,completedOrderCount:number}>}
 */
export const getDeliveryProfileSummary = () => api.get('/api/delivery/profile/summary');
