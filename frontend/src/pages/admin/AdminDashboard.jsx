import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import adminDashboardService from '../../services/adminDashboardService';
import { useAuth } from '../../context/AuthContext';
import AdminDeliveryLayout from '../../components/admin/delivery/AdminDeliveryLayout';

/**
 * Admin Dashboard Component
 * Layer: UI (React component)
 * Displays admin KPI metrics, alerts, and operational overview
 */
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminDashboardService.getDashboardMetrics();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
      setError('Failed to load dashboard metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const summaryCards = [
    {
      label: 'Total Orders',
      value: dashboardData?.totalOrders || 0,
      hint: 'All-time customer orders',
      tone: 'text-[#0d4a38]'
    },
    {
      label: 'Total Revenue',
      value: `Rs. ${(dashboardData?.totalRevenue || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      hint: 'From confirmed orders',
      tone: 'text-[#0d4a38]'
    },
    {
      label: 'Total Products',
      value: dashboardData?.totalProductsCount || 0,
      hint: 'Active catalog items',
      tone: 'text-slate-900'
    },
    {
      label: 'Active Suppliers',
      value: dashboardData?.activeSuppliersCount || 0,
      hint: 'Registered suppliers',
      tone: 'text-slate-900'
    },
  ];

  const actions = (
    <>
      <Link
        to="/admin/profile"
        className="inline-flex items-center rounded-lg border border-[#d4dfdb] bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        My Profile
      </Link>
      <button
        onClick={handleLogout}
        className="inline-flex items-center rounded-lg bg-[#0d4a38] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#083a2c]"
      >
        Logout
      </button>
    </>
  );

  return (
    <AdminDeliveryLayout
      title="UrbanFresh Admin"
      description={`Welcome, ${user?.name || 'Admin'} (Admin)`}
      breadcrumbCurrent="Overview"
      actions={actions}
    >
      {dashboardData?.summary?.lastUpdated && (
        <div className="rounded-2xl border border-[#e4ebe8] bg-white px-4 py-3 text-sm text-slate-500 sm:px-6">
          Last updated: {dashboardData.summary.lastUpdated}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-[#e4ebe8] bg-white" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchDashboardMetrics}
            className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <article
                key={card.label}
                className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className={`mt-2 text-2xl font-bold sm:text-3xl ${card.tone}`}>{card.value}</p>
                <p className="mt-2 text-xs text-slate-500">{card.hint}</p>
              </article>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm xl:col-span-2">
              <h2 className="text-lg font-semibold text-slate-900">Market Management</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ActionLink to="/admin/products" title="Manage Products" description="Add, edit, hide, and approve products." />
                <ActionLink to="/admin/inventory" title="Manage Inventory" description="Track stock, thresholds, and purchase orders." />
                <ActionLink to="/admin/orders" title="Manage Orders" description="Review order states and delivery readiness." />
                <ActionLink to="/admin/suppliers" title="Manage Suppliers" description="Create suppliers and assign brands." />
                <ActionLink to="/admin/brands" title="Manage Brands" description="Maintain active brand catalog data." />
                <ActionLink to="/admin/purchase-orders" title="Purchase Orders" description="Monitor purchasing workflow and status." />
              </div>
            </div>

            <div className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Operational Alerts</h2>
              <div className="mt-4 space-y-3">
                <AlertItem
                  label="Low Stock Items"
                  value={dashboardData?.lowStockItemsCount || 0}
                  hint="Products below reorder threshold"
                  tone="red"
                />
                <Link to="/admin/expiry" className="block">
                  <AlertItem
                    label="Near Expiry Items"
                    value={dashboardData?.nearExpiryItemsCount || 0}
                    hint="Items expiring within 7 days"
                    tone="amber"
                    linked
                  />
                </Link>
                <AlertItem
                  label="Wasted Value This Month"
                  value={`Rs. ${Number(dashboardData?.wastedValueThisMonth || 0).toLocaleString('en-LK', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                  hint="Expired stock loss this month"
                  tone="slate"
                />
              </div>
            </div>
          </section>
        </>
      )}
    </AdminDeliveryLayout>
  );
};

function ActionLink({ to, title, description }) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-[#e4ebe8] bg-[#f8fbf9] p-4 transition hover:border-[#c5d6cf] hover:bg-[#edf5f1]"
    >
      <p className="text-sm font-semibold text-slate-900 transition group-hover:text-[#0d4a38]">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </Link>
  );
}

function AlertItem({ label, value, hint, tone, linked = false }) {
  const toneClass =
    tone === 'red'
      ? 'border-red-200 bg-[#fdecee] text-red-700'
      : tone === 'amber'
        ? 'border-amber-200 bg-[#fdf4e8] text-amber-700'
        : 'border-slate-200 bg-[#f7f9f8] text-slate-700';

  return (
    <article
      className={`rounded-xl border p-3 transition ${toneClass} ${linked ? 'hover:brightness-95' : ''}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-80">{hint}</p>
    </article>
  );
}

export default AdminDashboard;
