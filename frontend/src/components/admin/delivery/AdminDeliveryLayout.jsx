import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

/**
 * Shared admin delivery layout used by delivery-related pages.
 */
export default function AdminDeliveryLayout({
  title,
  description,
  breadcrumbCurrent,
  breadcrumbItems,
  actions,
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navItems = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/products', label: 'Manage Products' },
    { to: '/admin/inventory', label: 'Inventory' },
    { to: '/admin/orders', label: 'Manage Orders' },
    { to: '/admin/delivery-personnel', label: 'Delivery Personnel' },
    { to: '/admin/suppliers', label: 'Manage Suppliers' },
    { to: '/admin/brands', label: 'Manage Brands' },
    { to: '/admin/expiry', label: 'Expiry Management' },
    { to: '/admin/waste-report', label: 'Waste Report' },
  ];

  const isActivePath = (path) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

  const resolvedBreadcrumbs =
    Array.isArray(breadcrumbItems) && breadcrumbItems.length > 0
      ? breadcrumbItems
      : [
          { label: 'Dashboard', to: '/admin' },
          { label: breadcrumbCurrent || title || 'Overview' },
        ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-[#e4ebe8] bg-[#f5f7f6]/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d5dfdb] bg-white text-slate-600 lg:hidden"
              aria-label="Toggle admin navigation"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/admin" className="flex items-center gap-1 text-[20px] font-bold leading-none tracking-tight text-[#0e3f2e] md:text-[22px]">
              <img src="/logo.svg" alt="UrbanFresh logo" className="h-9 w-9" />
              <span>UrbanFresh</span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/admin/profile"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d5dfdb] bg-white text-slate-500 transition hover:text-[#0d4a38]"
              aria-label="Profile"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-9 items-center rounded-xl bg-[#0d4a38] px-3 text-sm font-semibold text-white transition hover:bg-[#083a2c]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-400">
        <aside className="hidden w-64 shrink-0 border-r border-[#e4ebe8] bg-[#f5f7f6] px-5 py-6 lg:block">
          <div className="mb-8 flex items-center gap-3 rounded-xl bg-white px-3 py-3 shadow-sm ring-1 ring-[#e4ebe8]">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d4a38] text-white">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 9.5 12 4l7 5.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 10v8h10v-8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14h4" />
              </svg>
            </span>
            <div>
              <p className="text-2xl font-semibold leading-none text-[#0d4a38]">Admin Portal</p>
            </div>
          </div>

          <nav className="space-y-1.5" aria-label="Admin navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#9be7bf] text-[#0d4a38] shadow-sm'
                      : 'text-[#5e7a72] hover:bg-white hover:text-[#0d4a38]'
                  }`
                }
                end={item.to === '/admin'}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
        )}
        <aside
          className={`fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] w-64 border-r border-[#e4ebe8] bg-white px-4 py-5 transition-transform lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Management</p>
          <nav className="mt-3 space-y-1" aria-label="Admin navigation mobile">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#eaf5ef] text-[#0d4a38]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
                end={item.to === '/admin'}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-5 border-t border-[#e7eeeb] pt-4">
            <NavLink
              to="/admin/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={`mt-1 flex items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActivePath('/admin/profile')
                  ? 'bg-[#eaf5ef] text-[#0d4a38]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              My Profile
            </NavLink>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Log Out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#e4ebe8] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <nav className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500" aria-label="Breadcrumb">
                    {resolvedBreadcrumbs.map((item, index) => (
                      <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                        {item.to ? (
                          <Link className="hover:text-[#0d4a38]" to={item.to}>
                            {item.label}
                          </Link>
                        ) : (
                          <span className="font-semibold text-slate-700">{item.label}</span>
                        )}
                        {index < resolvedBreadcrumbs.length - 1 ? <span aria-hidden="true">&gt;</span> : null}
                      </div>
                    ))}
                  </nav>
                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
                  {description ? <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p> : null}
                </div>
                {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
