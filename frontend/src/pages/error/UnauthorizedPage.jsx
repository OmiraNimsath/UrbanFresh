import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** Maps each role to its own dashboard path. */
const ROLE_DASHBOARD = {
  ADMIN: '/admin',
  SUPPLIER: '/supplier',
  DELIVERY: '/delivery',
  CUSTOMER: '/dashboard',
};

/**
 * Presentation Layer – Shown when a user tries to access a page their role cannot reach.
 * Displays a 403 message and provides a role-aware back link so each user returns
 * to their own dashboard rather than the generic home page.
 */
export default function UnauthorizedPage() {
  const { isAuthenticated, user } = useAuth();

  // Direct authenticated users to their own dashboard; guests to login
  const backPath = isAuthenticated
    ? (ROLE_DASHBOARD[user?.role] ?? '/')
    : '/login';

  const backLabel = isAuthenticated ? 'Go to My Dashboard' : 'Go to Login';

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
        <h1 className="text-5xl font-bold text-red-500 mb-4">403</h1>
        <p className="text-gray-700 font-medium mb-2">Access Denied</p>
        <p className="text-gray-500 text-sm mb-6">
          You don&apos;t have permission to access this page.
          {isAuthenticated && user?.role && (
            <span> Your current role is <strong>{user.role}</strong>.</span>
          )}
        </p>
        <Link
          to={backPath}
          className="text-green-600 hover:underline font-medium text-sm"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
