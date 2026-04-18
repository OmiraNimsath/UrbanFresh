import { useEffect, useMemo, useState } from 'react';
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
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const filteredOrders = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    return historyOrders.filter((order) => {
      if (!q) return true;
      return (
        String(order.orderId).includes(q) ||
        String(order.customerName || '').toLowerCase().includes(q)
      );
    });
  }, [historyOrders, searchValue]);

  const statusFilteredOrders = useMemo(() => {
    let result = statusFilter === 'ALL'
      ? filteredOrders
      : filteredOrders.filter((order) => String(order?.status || '').toUpperCase() === statusFilter);
    result = [...result].sort((a, b) =>
      sortDir === 'desc' ? b.orderId - a.orderId : a.orderId - b.orderId,
    );
    return result;
  }, [filteredOrders, statusFilter, sortDir]);

  useEffect(() => { setPage(0); }, [searchValue, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(statusFilteredOrders.length / PAGE_SIZE));
  const pagedOrders = statusFilteredOrders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
        <input
          type="text"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search by order ID or customer"
          className="h-14 w-full rounded-2xl border border-[#d6dfdb] bg-[#eef2f0] px-5 text-base text-[#214338] outline-none transition focus:border-[#9ad3b7] focus:bg-white"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
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
          <select
            value={sortDir}
            onChange={(e) => { setSortDir(e.target.value); setPage(0); }}
            className="h-9 rounded-xl border border-[#dce8e3] bg-[#f4f7f6] px-3 text-sm text-[#5f7770] focus:outline-none"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>

        {loading && <p className="mt-4 text-sm text-slate-500">Loading history...</p>}
        {!loading && error === 'forbidden' && <p className="mt-4 text-sm text-red-700">You are not authorized to access delivery orders.</p>}
        {!loading && error === 'failed' && <p className="mt-4 text-sm text-slate-700">Failed to load history. Please refresh.</p>}

        {!loading && !error && statusFilteredOrders.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">
            {historyOrders.length === 0 ? 'No delivery history yet.' : 'No history orders match your filters.'}
          </p>
        )}

        {!loading && !error && statusFilteredOrders.length > 0 && (
          <ul className="mt-4 space-y-3">
            {pagedOrders.map((delivery) => (
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

        {!loading && !error && totalPages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce8e3] bg-white text-[#0d4a38] disabled:opacity-30"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-2 text-sm font-semibold transition ${
                  i === page
                    ? 'border-[#01412d] bg-[#01412d] text-white'
                    : 'border-[#dce8e3] bg-white text-[#4a6259] hover:bg-[#f1f6f4]'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce8e3] bg-white text-[#0d4a38] disabled:opacity-30"
            >
              ›
            </button>
          </div>
        )}
      </section>
    </DeliveryPageLayout>
  );
}
