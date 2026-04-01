import { Link } from 'react-router-dom';

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
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-xs text-slate-500" aria-label="Breadcrumb">
              <Link className="hover:text-green-700" to="/admin">
                Dashboard
              </Link>
              <span aria-hidden="true">&gt;</span>
              <span className="font-semibold text-slate-700">{breadcrumbCurrent}</span>
            </nav>
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <span aria-hidden="true">&larr;</span>
              <span>Back to Dashboard</span>
            </Link>
            {actions}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
