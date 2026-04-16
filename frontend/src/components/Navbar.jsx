import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationBell from './NotificationBell';

/**
 * Presentation Layer – Shared auth-aware navigation bar.
 * Shows login/register links for guests and a welcome message,
 * dashboard link, and logout button for authenticated users.
 * Used by LandingPage and ProductListingPage (public pages that
 * need to reflect session state without being protected routes).
 */

/** Maps each backend role to its dashboard route. */
const ROLE_DASHBOARD = {
  CUSTOMER: '/dashboard',
  ADMIN: '/admin',
  SUPPLIER: '/supplier',
  DELIVERY: '/delivery',
};

/**
 * Renders the top navigation bar.
 * Reads auth state from AuthContext so it always reflects the
 * live session — no prop drilling required.
 */
export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  // Cart context is only available when the user is a CUSTOMER;
  // useCart() is safe to call here because CartProvider wraps the whole tree.
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const dashboardPath = ROLE_DASHBOARD[user?.role] || '/';

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-0 text-2xl font-bold text-green-600 tracking-tight">
          <img src="/logo.svg" alt="UrbanFresh logo" className="h-9 w-9" />
          UrbanFresh
        </Link>

        {isAuthenticated ? (
          /* ── Authenticated state ── */
          <div className="flex items-center gap-3">
            {/* Friendly welcome badge */}
            <span className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 font-medium">
              <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 rounded-full text-green-600 text-xs">✓</span>
              Welcome back, {user?.name}!
            </span>

            {/* Notification bell — visible to CUSTOMER only */}
            {user?.role === 'CUSTOMER' && <NotificationBell />}

            {/* Cart shortcut — visible to CUSTOMER only */}
            {user?.role === 'CUSTOMER' && (
              <Link
                to="/cart"
                className="relative px-3 py-2 text-sm font-medium text-green-700 border border-green-600 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1"
                aria-label="Shopping cart"
              >
                🛒
                {cart.itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-0.5">
                    {cart.itemCount > 99 ? '99+' : cart.itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* Dashboard shortcut */}
            <Link
              to={dashboardPath}
              className="px-4 py-2 text-sm font-medium text-green-700 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
            >
              My Dashboard
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
            >
              Log Out
            </button>
          </div>
        ) : (
          /* ── Guest state ── */
          <div className="flex gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-green-700 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
