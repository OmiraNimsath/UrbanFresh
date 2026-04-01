import { Link } from 'react-router-dom';

/**
 * Shared mobile-first layout for delivery pages with consistent header and quick navigation.
 */
export default function DeliveryPageLayout({ title, subtitle, children, actions }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            {actions}
          </div>

          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Delivery navigation">
            <Link to="/delivery" className="h-10 shrink-0 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center">
              Dashboard
            </Link>
            <Link to="/delivery/orders/current" className="h-10 shrink-0 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center">
              Current Orders
            </Link>
            <Link to="/delivery/orders/history" className="h-10 shrink-0 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center">
              History
            </Link>
            <Link to="/delivery/profile" className="h-10 shrink-0 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center">
              My Profile
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 pt-4 sm:px-6 sm:pt-6">{children}</main>
    </div>
  );
}
