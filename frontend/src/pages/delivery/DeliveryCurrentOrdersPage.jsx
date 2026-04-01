import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import DeliveryOrderCard from '../../components/delivery/DeliveryOrderCard';
import DeliveryPageLayout from '../../components/delivery/DeliveryPageLayout';
import useDeliveryOrders from '../../hooks/useDeliveryOrders';

/**
 * Delivery current orders page focused on active fulfillment operations.
 */
export default function DeliveryCurrentOrdersPage() {
  const navigate = useNavigate();
  const { currentOrders, loading, error, refreshOrders } = useDeliveryOrders();
  const [searchValue, setSearchValue] = useState('');

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return currentOrders.filter((order) => {
      if (!normalizedSearch) return true;

      return (
        String(order.orderId).includes(normalizedSearch) ||
        String(order.customerName || '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [currentOrders, searchValue]);

  const handleOpenOrder = (orderId) => {
    navigate(`/delivery/orders/${orderId}`);
  };

  const handleRefresh = async () => {
    await refreshOrders();
    toast.success('Current orders refreshed.');
  };

  return (
    <DeliveryPageLayout
      title="Current Orders"
      subtitle="Track active assignments and open details quickly."
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Newly Assigned Orders</h2>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {currentOrders.length} Out for Delivery
          </span>
        </div>

        {currentOrders.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No newly assigned out-for-delivery orders right now.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {currentOrders.slice(0, 4).map((order) => (
              <button
                key={order.orderId}
                type="button"
                onClick={() => handleOpenOrder(order.orderId)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:bg-slate-100"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">Order #{order.orderId}</p>
                  <span className="text-xs font-medium text-emerald-700">Open</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{order.customerName || 'Customer'}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-2">
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search by order ID or customer"
            className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        {loading && <p className="mt-4 text-sm text-slate-500">Loading orders...</p>}
        {!loading && error === 'forbidden' && <p className="mt-4 text-sm text-red-700">You are not authorized to access delivery orders.</p>}
        {!loading && error === 'failed' && <p className="mt-4 text-sm text-slate-700">Failed to load orders. Please refresh.</p>}

        {!loading && !error && filteredOrders.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">No newly assigned orders match your search.</p>
        )}

        {!loading && !error && filteredOrders.length > 0 && (
          <ul className="mt-4 space-y-3">
            {filteredOrders.map((delivery) => (
              <li key={delivery.orderId}>
                <DeliveryOrderCard delivery={delivery} onOpen={handleOpenOrder} showNewlyAssigned />
              </li>
            ))}
          </ul>
        )}
      </section>
    </DeliveryPageLayout>
  );
}
