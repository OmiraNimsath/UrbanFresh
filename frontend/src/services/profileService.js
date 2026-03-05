/**
 * Service Layer – API calls for customer profile management.
 * All requests are authenticated via the Bearer token attached by the api.js interceptor.
 */

import api from './api';

/**
 * Fetch the authenticated customer's profile.
 * GET /api/profile
 *
 * @returns {Promise<ProfileResponse>} profile data (id, name, email, phone, address, role)
 */
export const getProfile = () => api.get('/api/profile');

/**
 * Update the authenticated customer's profile.
 * PUT /api/profile
 *
 * @param {{ name: string, phone?: string, address?: string }} data - fields to update
 * @returns {Promise<ProfileResponse>} updated profile data
 */
export const updateProfile = (data) => api.put('/api/profile', data);
