import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiClock, FiPackage, FiTruck, FiUser } from 'react-icons/fi';

import { useAuth } from '../../context/AuthContext';
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
    activeOrders,
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
      activeKey="dashboard"
      onRefresh={handleRefresh}
      onLogout={handleLogout}
    >
      <section className="rounded-[26px] bg-linear-to-r from-[#114f39] to-[#1b5a42] p-6 text-white shadow-sm sm:p-8">
        <h2 className="text-3xl font-semibold leading-tight sm:text-[32px]">Ready to Deliver?</h2>
        <p className="mt-3 max-w-xl text-base text-[#c6ddd4]">
          {user?.name || 'Delivery partner'}, you have {activeOrders.length} active orders assigned for delivery today.
        </p>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Link to="/delivery/orders/current" className="rounded-3xl bg-[#a7ecc6] p-5 text-[#1b5e45] shadow-sm transition hover:brightness-[0.98]">
          <FiTruck size={24} />
          <p className="mt-4 text-xs font-medium tracking-[0.08em]">Active Orders</p>
          <p className="mt-2 text-3xl font-semibold leading-none">{activeOrders.length}</p>
        </Link>
        <Link to="/delivery/orders/history" className="rounded-3xl border border-[#dce7e2] bg-white p-5 shadow-sm transition hover:border-[#c9dbd2]">
          <FiClock size={24} className="text-[#0d4a38]" />
          <p className="mt-4 text-xs font-medium tracking-[0.08em] text-[#576d65]">Delivery History</p>
          <p className="mt-2 text-2xl font-semibold text-[#123f32]">{historyOrders.length}</p>
        </Link>
        <Link to="/delivery/profile" className="rounded-3xl border border-[#dce7e2] bg-white p-5 shadow-sm transition hover:border-[#c9dbd2]">
          <FiUser size={24} className="text-[#0d4a38]" />
          <p className="mt-4 text-xs font-medium tracking-[0.08em] text-[#576d65]">My Profile</p>
          <p className="mt-2 text-base font-semibold text-[#123f32]">Manage details</p>
        </Link>
        <div className="rounded-3xl border border-[#dce7e2] bg-white p-5 shadow-sm">
          <FiPackage size={24} className="text-[#0d4a38]" />
          <p className="mt-4 text-xs font-medium tracking-[0.08em] text-[#576d65]">Total Orders</p>
          <p className="mt-2 text-2xl font-semibold text-[#123f32]">{orders.length}</p>
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-[#e4ebe8] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-2xl font-semibold leading-tight text-[#0d3f31] sm:text-3xl">Active Shipments</h3>
            <p className="text-sm text-[#6f817b]">{outForDeliveryOrders.length} active deliveries in progress.</p>
          </div>
          <Link to="/delivery/orders/current" className="text-sm font-semibold text-[#1d6a4d] hover:text-[#114f39]">
            View All
          </Link>
        </div>

        {loading && <p className="mt-3 text-sm text-slate-500">Loading assigned orders...</p>}
        {!loading && error === 'forbidden' && <p className="mt-3 text-sm text-red-700">You are not authorized to access delivery assignments.</p>}
        {!loading && error === 'failed' && <p className="mt-3 text-sm text-slate-700">Failed to load assigned deliveries. Please refresh.</p>}

        {!loading && !error && outForDeliveryOrders.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">No out-for-delivery orders at the moment.</p>
        )}

        {!loading && !error && outForDeliveryOrders.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {outForDeliveryOrders.slice(0, 6).map((order) => (
              <button
                key={order.orderId}
                type="button"
                onClick={() => navigate(`/delivery/orders/${order.orderId}`)}
                className="flex w-full items-center gap-3 rounded-2xl border border-[#e7eeea] bg-white px-3 py-3 text-left transition hover:border-[#cddfd6] hover:bg-[#f8fbf9]"
              >
                <div className={`h-14 w-14 shrink-0 rounded-xl flex items-center justify-center ${order?.status === 'OUT_FOR_DELIVERY' ? 'bg-[#dfeee6]' : 'bg-[#f3f7f4]'}`}>
                  <FiPackage size={20} className="text-[#1b5e45]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium tracking-wide text-[#6f817b]">Order ID #{order.orderId}</p>
                  <p className="truncate text-lg font-semibold text-[#123f32] sm:text-xl">{order.customerName || 'Customer'}</p>
                  <p className="text-sm text-[#6f817b] mt-1">{order.customerPhone || 'No phone'}</p>
                  <p className="text-sm text-[#63716d] mt-1 truncate">{order.shortDeliveryAddress || order.fullDeliveryAddress || 'Address not available'}</p>
                </div>
                <span className="text-2xl text-[#8da49d]">›</span>
              </button>
            ))}
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <p className="mt-4 text-xs text-slate-500">Total orders: {orders.length}</p>
        )}
      </section>

      <section className="mt-4 rounded-3xl bg-[#9fe5c0] p-5 text-[#0f4936] shadow-sm">
        <p className="text-xs font-medium tracking-[0.08em]">Eco Tip</p>
        <p className="mt-2 text-base">
          Optimizing your route today can reduce fuel usage and delivery delay risk.
        </p>
      </section>
    </DeliveryPageLayout>
  );
}
