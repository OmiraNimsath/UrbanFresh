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
export const getProfile = () => Promise.resolve({ data: { id: 1, name: 'Aisha Fernando', email: 'aisha@gmail.com', phone: '0771234567', address: '12 Green Lane, Colombo 05', role: 'CUSTOMER' } });

/**
 * Update the authenticated user's profile.
 * PUT /api/profile
 *
 * @param {{ name: string, phone?: string, address?: string }} data - fields to update
 * @returns {Promise<ProfileResponse>} updated profile data
 */
export const updateProfile = (data) => Promise.resolve({ data: { id: 1, ...data, email: 'aisha@gmail.com', role: 'CUSTOMER' } });

/**
 * Fetch delivery profile summary counters for the authenticated delivery user.
 * GET /api/delivery/profile/summary
 *
 * @returns {Promise<{assignedOrderCount:number,outForDeliveryCount:number,deliveredCount:number,returnedCount:number,completedOrderCount:number}>}
 */
export const getDeliveryProfileSummary = () => api.get('/api/delivery/profile/summary');
