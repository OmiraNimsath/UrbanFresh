import api from './api';

/**
 * Admin Dashboard API Service
 * Layer: Service (API calls)
 * Handles all HTTP requests for admin dashboard metrics and alerts
 */

/**
 * Fetch admin dashboard metrics (KPIs and alerts)
 * @returns Promise<AdminDashboardResponse> containing dashboard data
 * @throws Error if unauthorized (403) or unauthenticated (401)
 */
export const getDashboardMetrics = async () => {
  try {
    const response = await api.get('/api/admin/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
};

export default {
  getDashboardMetrics,
};
