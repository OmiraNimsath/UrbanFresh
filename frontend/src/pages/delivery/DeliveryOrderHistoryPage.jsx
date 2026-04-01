import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import DeliveryOrderCard from '../../components/delivery/DeliveryOrderCard';
import DeliveryPageLayout from '../../components/delivery/DeliveryPageLayout';
import useDeliveryOrders from '../../hooks/useDeliveryOrders';

/**
 * Delivery order history page for completed outcomes.
 */
export default function DeliveryOrderHistoryPage() {
  const navigate = useNavigate();
  const { historyOrders, loading, error, refreshOrders } = useDeliveryOrders();
  const [searchValue, setSearchValue] = useState('');

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return historyOrders.filter((order) => {
      if (!normalizedSearch) return true;

      return (
        String(order.orderId).includes(normalizedSearch) ||
        String(order.customerName || '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [historyOrders, searchValue]);

  const handleRefresh = async () => {
    await refreshOrders();
    toast.success('Order history refreshed.');
  };

  return (
    <DeliveryPageLayout
      title="Order History"
      subtitle="Review delivered and returned assignments."
      actions={
        <button
          type="button"
          onClick={handleRefresh}
          className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Refresh
        </button>
      }
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-2">
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search by order ID or customer"
            className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        {loading && <p className="mt-4 text-sm text-slate-500">Loading history...</p>}
        {!loading && error === 'forbidden' && <p className="mt-4 text-sm text-red-700">You are not authorized to access delivery orders.</p>}
        {!loading && error === 'failed' && <p className="mt-4 text-sm text-slate-700">Failed to load history. Please refresh.</p>}

        {!loading && !error && filteredOrders.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">No history orders match your filters.</p>
        )}

        {!loading && !error && filteredOrders.length > 0 && (
          <ul className="mt-4 space-y-3">
            {filteredOrders.map((delivery) => (
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
