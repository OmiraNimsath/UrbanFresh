import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

/**
 * Shared admin delivery layout used by delivery-related pages.
 */
export default function AdminDeliveryLayout({
  title,
  description,
  breadcrumbCurrent,
  actions,
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/products', label: 'Product Management' },
    { to: '/admin/inventory', label: 'Inventory Management' },
    { to: '/admin/orders', label: 'Manage Orders' },
    { to: '/admin/expiry', label: 'Manage Expiry' },
  ];

  const utilityItems = [
    { to: '/admin/profile', label: 'My Profile' },
    { to: '/login', label: 'Log Out' },
  ];

  const isActivePath = (path) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-[#e4ebe8] bg-white/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
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
            <Link to="/admin" className="text-sm font-semibold tracking-tight text-[#0d4a38] sm:text-base">
              UrbanFresh
            </Link>
            <span className="hidden text-xs text-slate-400 sm:inline">Admin Portal</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/profile"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d5dfdb] bg-white text-slate-500 transition hover:text-[#0d4a38]"
              aria-label="Profile"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d5dfdb] bg-white text-slate-500 transition hover:text-red-600"
              aria-label="Log out"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5M21 12H9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-400">
        <aside className="hidden w-64 shrink-0 border-r border-[#e4ebe8] bg-white px-4 py-5 lg:block">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Management</p>
          <nav className="mt-3 space-y-1" aria-label="Admin navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
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

          <div className="mt-6 border-t border-[#eef2f0] pt-4">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Account</p>
            <div className="mt-3 space-y-1">
              {utilityItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActivePath(item.to)
                      ? 'bg-[#eaf5ef] text-[#0d4a38]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
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
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#e4ebe8] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <nav className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500" aria-label="Breadcrumb">
                    <Link className="hover:text-[#0d4a38]" to="/admin">
                      Dashboard
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="font-semibold text-slate-700">{breadcrumbCurrent}</span>
                  </nav>
                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
                  {description ? <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-2 rounded-lg border border-[#d4dfdb] bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <span aria-hidden="true">&larr;</span>
                    <span>Back</span>
                  </Link>
                  {actions}
                </div>
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
