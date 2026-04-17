/**
 * Service Layer – Centralized Axios instance for all authenticated API calls.
 * Attaches the JWT Authorization header automatically.
 * Intercepts 401 responses to trigger session expiry (auto-logout).
 *
 * Usage: import api from './api'; api.get('/some/endpoint');
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Registry for the session-expiry callback.
 * Populated at runtime by AuthContext via setExpireSessionCallback().
 * Avoids a circular dependency between api.js and AuthContext.
 */
let expireSessionFn = null;

/**
 * Register the callback that the 401 interceptor should invoke.
 * Called once by AuthProvider on mount.
 * @param {Function} fn - typically AuthContext.expireSession
 */
export const setExpireSessionCallback = (fn) => {
  expireSessionFn = fn;
};

/* ── Request interceptor: attach Bearer token ── */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('uf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ── Response interceptor: detect 401 → expire session ── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only expire session on 401 from protected endpoints (not login attempts)
    const isLoginRequest = error.config?.url?.includes('/api/auth/login');
    if (error.response?.status === 401 && !isLoginRequest && expireSessionFn) {
      expireSessionFn();
    }
    return Promise.reject(error);
  }
);

export default api;
