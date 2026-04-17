import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import DeliveryOrderCard from '../../components/delivery/DeliveryOrderCard';
import DeliveryPageLayout from '../../components/delivery/DeliveryPageLayout';
import useDeliveryOrders from '../../hooks/useDeliveryOrders';
import { useAuth } from '../../context/AuthContext';

/**
 * Delivery order history page for completed outcomes.
 */
export default function DeliveryOrderHistoryPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { historyOrders, loading, error, refreshOrders } = useDeliveryOrders();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return historyOrders.filter((order) => {
      if (!normalizedSearch) return true;
      const matchesSearch = (
        String(order.orderId).includes(normalizedSearch) ||
        String(order.customerName || '').toLowerCase().includes(normalizedSearch)
      );

      return matchesSearch;
    });
  }, [historyOrders, searchValue]);

  const statusFilteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') {
      return filteredOrders;
    }

    return filteredOrders.filter((order) => String(order?.status || '').toUpperCase() === statusFilter);
  }, [filteredOrders, statusFilter]);

  const handleRefresh = async () => {
    await refreshOrders();
    toast.success('Order history refreshed.');
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  return (
    <DeliveryPageLayout
      activeKey="history"
      pageTitle="Order History"
      onRefresh={handleRefresh}
      onLogout={handleLogout}
    >
      <section className="rounded-3xl border border-[#e4ebe8] bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-2">
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search by order ID or customer"
            className="h-14 w-full rounded-2xl border border-[#d6dfdb] bg-[#eef2f0] px-5 text-base text-[#214338] outline-none transition focus:border-[#9ad3b7] focus:bg-white"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {[['ALL', 'All'], ['DELIVERED', 'Delivered'], ['RETURNED', 'Returned'], ['CANCELLED', 'Cancelled']].map(([value, label]) => {
            const active = statusFilter === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-[#01412d] text-white'
                    : 'bg-[#e6ebe8] text-[#4f5a56] hover:bg-[#dfe6e2]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {loading && <p className="mt-4 text-sm text-slate-500">Loading history...</p>}
        {!loading && error === 'forbidden' && <p className="mt-4 text-sm text-red-700">You are not authorized to access delivery orders.</p>}
        {!loading && error === 'failed' && <p className="mt-4 text-sm text-slate-700">Failed to load history. Please refresh.</p>}

        {!loading && !error && statusFilteredOrders.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">No history orders match your filters.</p>
        )}

        {!loading && !error && statusFilteredOrders.length > 0 && (
          <ul className="mt-4 space-y-3">
            {statusFilteredOrders.map((delivery) => (
              <li key={delivery.orderId}>
                <DeliveryOrderCard
                  delivery={delivery}
                  onOpen={(orderId) => navigate(`/delivery/orders/${orderId}`)}
                  showHistoryMeta
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </DeliveryPageLayout>
  );
}
