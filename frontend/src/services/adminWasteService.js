import api from './api';

/**
 * Admin Waste Report API Service
 * Layer: Service (API calls)
 * Handles the HTTP request for the admin waste report.
 */

/**
 * Fetch the full waste report for the admin.
 * Calls GET /api/admin/waste-report.
 *
 * @returns {Promise<WasteReportResponse>} report with monthlySummaries,
 *   topWastedProducts, totalWasteValue, totalWastedUnits
 * @throws Error if unauthorized (401/403) or request fails
 */
export const getWasteReport = async () => {
  try {
    const response = await api.get('/api/admin/waste-report');
    return response.data;
  } catch (error) {
    console.error('Error fetching waste report:', error);
    throw error;
  }
};

export default {
  getWasteReport,
};
