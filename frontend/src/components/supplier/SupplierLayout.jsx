import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiGrid, FiLogOut, FiPackage, FiUser } from 'react-icons/fi';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: FiGrid, path: '/supplier' },
  { key: 'purchase-orders', label: 'Purchase Orders', icon: FiPackage, path: '/supplier/purchase-orders' },
  { key: 'profile', label: 'My Profile', icon: FiUser, path: '/supplier/profile' },
];

/**
 * Layout Layer - Shared supplier app shell for dashboard and purchase order pages.
 */
export default function SupplierLayout({
  activeKey,
  pageTitle,
  pageSubtitle,
  title,
  description,
  breadcrumbCurrent,
  breadcrumbItems,
  actions,
  pageAction,
  userName,
  onLogout,
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const resolvedTitle = pageTitle || title || 'Supplier';
  const resolvedDescription = pageSubtitle || description;
  const resolvedActions = actions || pageAction;
  const resolvedBreadcrumbs =
    Array.isArray(breadcrumbItems) && breadcrumbItems.length > 0
      ? breadcrumbItems
      : [
          { label: 'Dashboard', to: '/supplier' },
          { label: breadcrumbCurrent || resolvedTitle },
        ];

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-[#173b31]">
      <header className="sticky top-0 z-40 border-b border-[#e4ebe8] bg-[#f5f7f6]/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d5dfdb] bg-white text-slate-600 lg:hidden"
              aria-label="Toggle supplier navigation"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/supplier" className="flex items-center gap-1 text-[20px] font-bold leading-none tracking-tight text-[#0e3f2e]">
              <img src="/logo.svg" alt="UrbanFresh logo" className="h-9 w-9" />
              <span>UrbanFresh</span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden text-sm font-medium text-[#6f817b] sm:inline">{userName || 'Supplier'}</span>
            <Link
              to="/supplier/profile"
              aria-label="Supplier profile"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d5dfdb] bg-white text-sm font-semibold text-[#0d4a38]"
            >
              {(userName || 'S').charAt(0).toUpperCase()}
            </Link>
            <button
              type="button"
              onClick={onLogout}
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
              <FiPackage className="h-4 w-4" />
            </span>
            <div>
              <p className="text-2xl font-semibold leading-none text-[#0d4a38]">Supplier Portal</p>
            </div>
          </div>

          <nav className="space-y-1.5" aria-label="Supplier navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive || activeKey === item.key
                        ? 'bg-[#9be7bf] text-[#0d4a38] shadow-sm'
                        : 'text-[#5e7a72] hover:bg-white hover:text-[#0d4a38]'
                    }`
                  }
                  end={item.path === '/supplier'}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
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
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Supplier</p>
          <nav className="mt-3 space-y-1" aria-label="Supplier navigation mobile">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.key}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive || activeKey === item.key
                      ? 'bg-[#eaf5ef] text-[#0d4a38]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
                end={item.path === '/supplier'}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onLogout();
            }}
            className="mt-5 flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <FiLogOut className="mr-2 h-4 w-4" />
            Log Out
          </button>
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
                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{resolvedTitle}</h1>
                  {resolvedDescription ? <p className="mt-2 max-w-3xl text-sm text-slate-600">{resolvedDescription}</p> : null}
                </div>
                {resolvedActions ? <div className="flex flex-wrap items-center gap-2">{resolvedActions}</div> : null}
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
