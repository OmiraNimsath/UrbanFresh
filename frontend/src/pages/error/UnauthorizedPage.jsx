import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

/**
 * Presentation Layer – Shown when a user tries to access a page their role cannot reach.
 * Displays a 403 message and provides a role-aware back link so each user returns
 * to their own dashboard rather than the generic home page.
 */
export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const ROLE_DASHBOARD = {
    CUSTOMER: '/dashboard',
    ADMIN: '/admin',
    SUPPLIER: '/supplier',
    DELIVERY: '/delivery',
  };

  const backPath = ROLE_DASHBOARD[user?.role] || '/';
  const backLabel = user?.role ? 'Go to My Dashboard' : 'Go to Homepage';

  useEffect(() => {
    const redirectTimer = window.setTimeout(() => {
      navigate(backPath, { replace: true });
    }, 3000);

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, [backPath, navigate]);

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-[#163a2f]">
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-12 md:px-8 md:py-16">
        <section className="w-full max-w-xl rounded-2xl border border-[#e4ebe8] bg-white p-8 text-center shadow-sm">
          <span className="inline-flex items-center rounded-full border border-[#fdecee] bg-[#fdecee] px-3 py-1 text-xs font-semibold text-red-700">
            Restricted Route
          </span>

          <h1 className="mt-5 text-5xl font-extrabold text-red-600">403</h1>
          <p className="mt-3 text-xl font-semibold text-[#163a2f]">Access Denied</p>

          <p className="mx-auto mt-3 max-w-md text-sm text-[#6f817b]">
            You do not have permission to access this page.
            {isAuthenticated && user?.role && (
              <span> Your current role is <strong>{user.role}</strong>.</span>
            )}
          </p>

          {location.state?.attemptedPath && (
            <p className="mt-2 text-xs text-[#7f8f89]">
              Attempted route: <strong>{location.state.attemptedPath}</strong>
            </p>
          )}

          <p className="mt-4 text-xs text-[#6f817b]">
            You will be redirected in a few seconds.
          </p>

          <div className="mt-6">
            <Link
              to={backPath}
              className="inline-flex items-center rounded-lg bg-[#0d4a38] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#083a2c]"
            >
              {backLabel}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
