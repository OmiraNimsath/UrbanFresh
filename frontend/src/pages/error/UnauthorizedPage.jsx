import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Presentation Layer – Shown when a user tries to access a page their role cannot reach.
 * Displays a 403 message and provides a role-aware back link so each user returns
 * to their own dashboard rather than the generic home page.
 */
export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const redirectTimer = window.setTimeout(() => {
      navigate('/', { replace: true });
    }, 3000);

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, [navigate]);

  const backPath = '/';
  const backLabel = 'Go to Homepage';

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
        <p className="text-gray-500 text-xs mb-5">
          You will be redirected to the homepage in a few seconds.
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
