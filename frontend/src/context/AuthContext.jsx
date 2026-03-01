import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { isTokenExpired, msUntilExpiry } from '../utils/tokenUtils';

/**
 * Context Layer – Manages authentication state across the app.
 * Stores JWT token and user info in localStorage for persistence.
 * Automatically logs out the user when the token expires (timer-based).
 * Provides login/logout/sessionExpired state to all components.
 */
const AuthContext = createContext(null);

const TOKEN_KEY = 'uf_token';
const USER_KEY = 'uf_user';

/** Parse stored user JSON safely. Returns null if invalid. */
const loadUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => loadUser());
  const [sessionExpired, setSessionExpired] = useState(false);
  const expiryTimerRef = useRef(null);

  /** Keep localStorage in sync whenever token/user changes. */
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  /** Clear auth state on logout. */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  /**
   * Mark session as expired and clear auth state.
   * Called by the auto-expiry timer or from an Axios 401 interceptor.
   */
  const expireSession = useCallback(() => {
    logout();
    setSessionExpired(true);
  }, [logout]);

  /** Reset the session-expired flag (e.g. after user sees the message). */
  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  /**
   * Start (or restart) the auto-logout timer based on the token's exp claim.
   * Fires expireSession() when the token naturally expires while the user is idle.
   */
  useEffect(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }

    if (!token) return;

    // If the stored token is already expired, expire immediately
    if (isTokenExpired(token)) {
      expireSession();
      return;
    }

    const ms = msUntilExpiry(token);
    expiryTimerRef.current = setTimeout(() => {
      expireSession();
    }, ms);

    return () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
      }
    };
  }, [token, expireSession]);

  /**
   * Save token and user info after successful login.
   * @param {string} jwt - JWT token from backend
   * @param {object} userData - { email, name, role }
   */
  const login = (jwt, userData) => {
    setSessionExpired(false);
    setToken(jwt);
    setUser(userData);
  };

  const isAuthenticated = !!token && !isTokenExpired(token);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        sessionExpired,
        login,
        logout,
        expireSession,
        clearSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state from any component.
 * @returns {{ token, user, isAuthenticated, sessionExpired, login, logout, expireSession, clearSessionExpired }}
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
