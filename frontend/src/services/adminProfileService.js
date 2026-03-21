import api from './api';

/**
 * Admin Profile API Service
 * Layer: Service (API calls)
 * Handles all HTTP requests for admin profile operations
 */

/**
 * Fetch admin profile details
 * @returns Promise<ProfileResponse> with admin details (name, email, phone, address)
 * @throws Error if unauthorized (403) or unauthenticated (401)
 */
export const getAdminProfile = async () => {
  try {
    const response = await api.get('/api/admin/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    throw error;
  }
};

/**
 * Update admin profile details
 * @param {Object} profileData - { name, phone, address } to update
 * @returns Promise<ProfileResponse> with updated details
 * @throws Error if validation fails or unauthorized
 */
export const updateAdminProfile = async (profileData) => {
  try {
    const response = await api.put('/api/admin/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating admin profile:', error);
    throw error;
  }
};

export default {
  getAdminProfile,
  updateAdminProfile,
};
