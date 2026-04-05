import api from './api';

/**
 * Admin Expiry API Service
 * Layer: Service (API calls)
 * Fetches near-expiry product buckets for the admin expiry dashboard.
 */

/**
 * Retrieves products grouped into three urgency buckets (critical / urgent / warning).
 * @returns {Promise<ExpiryBucketResponse>} bucket data with within1Day, within7Days, within30Days lists
 */
export const getExpiryBuckets = () =>
  api.get('/api/admin/expiry/buckets').then(res => res.data);

export default { getExpiryBuckets };
