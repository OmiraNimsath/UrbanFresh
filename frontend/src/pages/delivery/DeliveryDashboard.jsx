import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getAssignedDeliveryOrders } from '../../services/orderService';

const PAGE_SIZE = 30;

const DELIVERY_STATUSES = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'OUT_FOR_DELIVERY', label: 'In Progress' },
  { value: 'DELIVERED', label: 'Delivered' },
];

function getStatusChipClass(status) {
  if (status === 'DELIVERED') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (status === 'OUT_FOR_DELIVERY') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (status === 'PENDING') {
    return 'border-slate-200 bg-slate-100 text-slate-700';
  }

  return 'border-blue-200 bg-blue-50 text-blue-700';
}

function formatStatusLabel(status) {
  if (!status) {
    return 'Pending';
  }

  return status
    .toLowerCase()
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

/**
 * Presentation Layer – Delivery dashboard with fast order access.
 * Optimized for quick, touch-friendly navigation on mobile devices.
 */
export default function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchValue, setSearchValue] = useState('');

  const loadAssignedDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const page = await getAssignedDeliveryOrders(0, PAGE_SIZE);
      setDeliveries(Array.isArray(page?.content) ? page.content : []);
    } catch (requestError) {
      const statusCode = requestError?.response?.status;
      if (statusCode === 403) {
        setError('forbidden');
      } else {
        setError('failed');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignedDeliveries();
  }, [loadAssignedDeliveries]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const handleOpenOrder = (orderId) => {
    navigate(`/delivery/orders/${orderId}`);
  };

  const handleRefresh = async () => {
    await loadAssignedDeliveries();
    toast.success('Assigned deliveries refreshed.');
  };

  const filteredDeliveries = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return deliveries.filter((delivery) => {
      const statusMatched = statusFilter === 'ALL' || delivery.status === statusFilter;
      if (!statusMatched) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return String(delivery.orderId).includes(normalizedSearch);
    });
  }, [deliveries, searchValue, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">My Deliveries</h1>
              <p className="mt-1 text-sm text-slate-500">Tap an assigned order to view full delivery details.</p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              DELIVERY
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-700">
            Welcome, <span className="font-semibold">{user?.name}</span>
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
            <input
              type="text"
              inputMode="numeric"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by order ID"
              className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
            <button
              type="button"
              onClick={handleRefresh}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Refresh
            </button>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {DELIVERY_STATUSES.map((status) => (
              <button
                key={status.value}
                type="button"
                onClick={() => setStatusFilter(status.value)}
                className={`h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${
                  statusFilter === status.value
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pt-4 sm:px-6 sm:pt-6">
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
              />
            ))}
          </div>
        )}

        {!loading && error === 'forbidden' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            You are not authorized to access delivery assignments.
          </div>
        )}

        {!loading && error === 'failed' && (
          <div className="rounded-2xl border border-slate-300 bg-white p-4 text-sm text-slate-700">
            Failed to load assigned deliveries. Tap refresh and try again.
          </div>
        )}

        {!loading && !error && filteredDeliveries.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">No deliveries assigned</h2>
            <p className="mt-2 text-sm text-slate-500">
              New delivery assignments will appear here automatically.
            </p>
          </div>
        )}

        {!loading && !error && filteredDeliveries.length > 0 && (
          <ul className="space-y-3">
            {filteredDeliveries.map((delivery) => (
              <li key={delivery.orderId}>
                <button
                  type="button"
                  onClick={() => handleOpenOrder(delivery.orderId)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Order #{delivery.orderId}</p>
                      <p className="mt-1 text-sm text-slate-600">{delivery.customerName || 'Customer'}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusChipClass(delivery.status)}`}
                    >
                      {formatStatusLabel(delivery.status)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-700">
                    {delivery.shortDeliveryAddress || delivery.fullDeliveryAddress}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {delivery.itemsSummary || `${delivery.itemCount || 0} item(s)`}
                    </p>
                    <span className="text-sm font-semibold text-emerald-700">View Details</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <p className="text-xs text-slate-500">Use logout when your shift ends.</p>
          <button
            onClick={handleLogout}
            className="h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
