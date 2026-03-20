/**
 * Service Layer – API calls for Stripe payment operations.
 * All requests use the authenticated Axios instance from api.js.
 */

import api from './api';

const DEFAULT_WEBHOOK_WAIT_TIMEOUT_MS = 15000;
const DEFAULT_WEBHOOK_POLL_INTERVAL_MS = 1500;

/**
 * Creates a Stripe PaymentIntent for the given order.
 * POST /api/payments/create-intent
 *
 * The backend resolves the amount from the persisted order (never from the client)
 * and returns a clientSecret for use with Stripe Elements.
 *
 * @param {number} orderId - ID of the order to pay for
 * @returns {Promise<{clientSecret: string, publishableKey: string, paymentIntentId: string, orderId: number}>}
 */
export const createPaymentIntent = (orderId) =>
  api.post('/api/payments/create-intent', { orderId }).then((res) => res.data);

/**
 * Fetches latest payment tracking status for an order.
 * GET /api/payments/orders/{orderId}/status
 *
 * @param {number} orderId - order to inspect
 * @returns {Promise<{orderId:number,paymentIntentId:string|null,paymentStatus:string,chargeUpdatedEventReceived:boolean,terminal:boolean}>}
 */
export const getPaymentTrackingStatus = (orderId) =>
  api.get(`/api/payments/orders/${orderId}/status`, {
    headers: {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  }).then((res) => res.data);

/**
 * Waits until webhook charge.updated is observed or timeout elapses,
 * then always fetches one final backend-truth status snapshot.
 *
 * @param {{
 *   orderId: number,
 *   timeoutMs?: number,
 *   pollIntervalMs?: number,
 *   onUpdate?: (status: object) => void,
 * }} params
 * @returns {Promise<{latestStatus: object, timedOut: boolean}>}
 */
export const waitForChargeUpdatedAndFetchLatest = async ({
  orderId,
  timeoutMs = DEFAULT_WEBHOOK_WAIT_TIMEOUT_MS,
  pollIntervalMs = DEFAULT_WEBHOOK_POLL_INTERVAL_MS,
  onUpdate,
}) => {
  const startedAt = Date.now();
  let latestStatus = null;

  while (Date.now() - startedAt < timeoutMs) {
    latestStatus = await getPaymentTrackingStatus(orderId);
    onUpdate?.(latestStatus);

    if (latestStatus?.chargeUpdatedEventReceived) {
      break;
    }

    await delay(pollIntervalMs);
  }

  const timedOut = !latestStatus?.chargeUpdatedEventReceived;

  // Final fetch after break/timeout ensures we navigate using latest backend state.
  latestStatus = await getPaymentTrackingStatus(orderId);
  onUpdate?.(latestStatus);

  return { latestStatus, timedOut };
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
