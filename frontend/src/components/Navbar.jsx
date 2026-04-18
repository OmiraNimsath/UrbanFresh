import { Link, useNavigate } from 'react-router-dom';
import { FiGrid, FiLogOut } from 'react-icons/fi';
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
    <nav className="sticky top-0 z-20 border-b border-[#dde4df] bg-[#f7f9f8]/95 backdrop-blur">
      <div className="flex w-full items-center justify-between px-4 py-3 md:px-8 lg:px-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1 text-[20px] font-bold leading-none tracking-tight text-[#0e3f2e] md:text-[22px]">
          <img src="/logo.svg" alt="UrbanFresh logo" className="h-9 w-9" />
          <span>UrbanFresh</span>
        </Link>

        {isAuthenticated ? (
          /* ── Authenticated state ── */
          <div className="flex items-center gap-2 md:gap-3">
            {/* Friendly welcome badge */}
            <span className="hidden items-center gap-1.5 rounded-full bg-[#eaf3ee] px-2.5 py-1 text-xs font-medium text-[#2f5a48] md:flex">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#0f5b3f] text-[10px] text-white">✓</span>
              Welcome back, {user?.name}!
            </span>

            {/* Notification bell — visible to CUSTOMER only */}
            {user?.role === 'CUSTOMER' && <NotificationBell />}

            {/* Cart shortcut — visible to CUSTOMER only */}
            {user?.role === 'CUSTOMER' && (
              <Link
                to="/cart"
                className="relative flex items-center gap-1 rounded-lg border border-[#c8d8cf] bg-white px-3 py-2 text-sm font-medium text-[#0d5138] transition-colors hover:bg-[#eef5f1]"
                aria-label="Shopping cart"
              >
                🛒
                {cart.itemCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#0e5c3f] px-0.5 text-xs font-bold text-white">
                    {cart.itemCount > 99 ? '99+' : cart.itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* Dashboard shortcut */}
            <Link
              to={dashboardPath}
              aria-label="My dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-[#c8d8cf] bg-white px-2.5 py-2 text-sm font-medium text-[#0d5138] transition-colors hover:bg-[#eef5f1] md:px-4"
            >
              <FiGrid className="md:hidden" size={16} aria-hidden="true" />
              <span className="hidden md:inline">My Dashboard</span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="inline-flex items-center justify-center rounded-lg bg-[#0f5b3f] px-2.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0a4831] md:px-4"
            >
              <FiLogOut className="md:hidden" size={16} aria-hidden="true" />
              <span className="hidden md:inline">Log Out</span>
            </button>
          </div>
        ) : (
          /* ── Guest state ── */
          <div className="flex gap-2 md:gap-3">
            <Link
              to="/login"
              className="rounded-lg border border-[#cad9d1] bg-white px-4 py-2 text-sm font-medium text-[#0e4f38] transition-colors hover:bg-[#eef5f1]"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-[#0f5b3f] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0a4831]"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
