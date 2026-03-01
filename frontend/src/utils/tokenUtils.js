/**
 * Utility Layer – JWT token helpers for the frontend.
 * Decodes the token payload (without verification) to read expiry and claims.
 * Verification is the backend's responsibility; this is used only for UX (auto-logout, guards).
 */

/**
 * Decode the payload section of a JWT (base64url → JSON).
 * Returns null if the token is malformed.
 * @param {string} token - raw JWT string
 * @returns {object|null} decoded payload
 */
export function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // base64url → base64 → decode
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Check whether a JWT is expired based on its `exp` claim.
 * Treats malformed/missing tokens as expired (safe default).
 * @param {string} token - raw JWT string
 * @returns {boolean} true if the token is expired or unreadable
 */
export function isTokenExpired(token) {
  if (!token) return true;

  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;

  // exp is in seconds; Date.now() is in milliseconds
  return Date.now() >= payload.exp * 1000;
}

/**
 * Get the number of milliseconds until the token expires.
 * Returns 0 if already expired or unreadable.
 * @param {string} token - raw JWT string
 * @returns {number} ms until expiry (≥ 0)
 */
export function msUntilExpiry(token) {
  if (!token) return 0;

  const payload = decodeToken(token);
  if (!payload || !payload.exp) return 0;

  const remaining = payload.exp * 1000 - Date.now();
  return Math.max(0, remaining);
}
