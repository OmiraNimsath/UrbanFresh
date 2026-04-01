import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import DeliveryPageLayout from '../../components/delivery/DeliveryPageLayout';
import useDeliveryOrders from '../../hooks/useDeliveryOrders';

/**
 * Presentation Layer – Delivery dashboard with fast order access.
 * Optimized for quick, touch-friendly navigation on mobile devices.
 */
export default function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    orders,
    currentOrders,
    historyOrders,
    outForDeliveryOrders,
    loading,
    error,
    refreshOrders,
  } = useDeliveryOrders();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const handleRefresh = async () => {
    await refreshOrders();
    toast.success('Delivery dashboard refreshed.');
  };

  return (
    <DeliveryPageLayout
      title="Delivery Dashboard"
      subtitle="Simple navigation to current orders, history, and profile updates."
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            Logout
          </button>
        </div>
      }
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm text-slate-600">
          Welcome, <span className="font-semibold text-slate-800">{user?.name}</span>
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link to="/delivery/orders/current" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Orders</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{currentOrders.length}</p>
            <p className="mt-1 text-sm text-slate-600">Open active assignments</p>
          </Link>
          <Link to="/delivery/orders/history" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">History</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{historyOrders.length}</p>
            <p className="mt-1 text-sm text-slate-600">Delivered and returned orders</p>
          </Link>
          <Link to="/delivery/profile" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">My Profile</p>
            <p className="mt-1 text-lg font-bold text-slate-900">Update Details</p>
            <p className="mt-1 text-sm text-slate-600">Name, phone and address</p>
          </Link>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Out For Delivery Now</h2>
          <Link
            to="/delivery/orders/current"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            View Current Orders
          </Link>
        </div>

        {loading && <p className="mt-3 text-sm text-slate-500">Loading assigned orders...</p>}
        {!loading && error === 'forbidden' && <p className="mt-3 text-sm text-red-700">You are not authorized to access delivery assignments.</p>}
        {!loading && error === 'failed' && <p className="mt-3 text-sm text-slate-700">Failed to load assigned deliveries. Please refresh.</p>}

        {!loading && !error && outForDeliveryOrders.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">No out-for-delivery orders at the moment.</p>
        )}

        {!loading && !error && outForDeliveryOrders.length > 0 && (
          <div className="mt-3 space-y-2">
            {outForDeliveryOrders.slice(0, 5).map((order) => (
              <button
                key={order.orderId}
                type="button"
                onClick={() => navigate(`/delivery/orders/${order.orderId}`)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">Order #{order.orderId}</p>
                  <span className="text-xs font-medium text-emerald-700">Open details</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{order.customerName || 'Customer'}</p>
              </button>
            ))}
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <p className="mt-4 text-xs text-slate-500">Total orders: {orders.length}</p>
        )}
      </section>
    </DeliveryPageLayout>
  );
}
