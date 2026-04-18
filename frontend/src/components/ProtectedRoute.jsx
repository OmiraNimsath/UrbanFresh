import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Routing Layer – Protects routes that require authentication.
 * Redirects unauthenticated users to /login.
 * When the session has expired (JWT timeout or backend 401), redirects
 * to /login where a "session expired" banner is shown.
 * Optionally restricts access to specific roles.
 *
 * @param {ReactNode} children - component to render if authorized
 * @param {string[]} [allowedRoles] - roles that can access (e.g. ['ADMIN']). If omitted, any authenticated user can access.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, sessionExpired } = useAuth();
  const location = useLocation();

  // Session expired — redirect with a flag so LoginPage can show the banner
  if (sessionExpired) {
    return <Navigate to="/login?expired=true" replace />;
  }

  // Not authenticated (no token or token missing)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles specified, check user's role
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace state={{ attemptedPath: location.pathname }} />;
  }

  return children;
}
