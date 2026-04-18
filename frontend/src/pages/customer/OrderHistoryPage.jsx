import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import CustomerAccountLayout from '../../components/customer/CustomerAccountLayout';
import CustomerOrderCard from '../../components/customer/CustomerOrderCard';
import PaymentModal from '../../components/PaymentModal';
import { getMyOrders } from '../../services/orderService';

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'RETURNED', label: 'Returned' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const PAGE_SIZE = 8;

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);

  useEffect(() => {
    getMyOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load order history.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(0); }, [activeFilter, search]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = activeFilter === 'ALL'
      ? [...orders]
      : orders.filter((o) => String(o.status || '').toUpperCase() === activeFilter);
    if (q) {
      result = result.filter(
        (o) =>
          String(o.orderId).includes(q) ||
          (o.items || []).some((item) => item.productName?.toLowerCase().includes(q)),
      );
    }
    result.sort((a, b) =>
      sortDir === 'desc' ? b.orderId - a.orderId : a.orderId - b.orderId,
    );
    return result;
  }, [activeFilter, orders, search, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = filteredOrders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleRetryPayment = (order) => {
    setSelectedOrderForPayment(order);
    setPaymentModalOpen(true);
  };

  return (
    <>
      <CustomerAccountLayout
        userName={user?.name}
        activeSection="orders"
        mobileActiveKey="orders"
        title="Order History"
        subtitle="Track and manage your grocery purchases with clear status visibility."
        breadcrumbItems={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Orders' }]}
      >
        <section className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm md:p-6">
          {/* Search + sort row */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8fa89f]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Search by order ID or item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#dce8e3] bg-[#f4f7f6] pl-9 pr-3 text-sm text-[#214338] outline-none focus:border-[#9ad3b7] focus:bg-white"
              />
            </div>
            <select
              value={sortDir}
              onChange={(e) => { setSortDir(e.target.value); setPage(0); }}
              className="h-10 rounded-xl border border-[#dce8e3] bg-[#f4f7f6] px-3 text-sm text-[#5f7770] outline-none"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>

          {/* Status filter pills */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  activeFilter === key
                    ? 'bg-[#0d4a38] text-white'
                    : 'bg-[#f1f5f3] text-[#567067] hover:bg-[#e9efec]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-[#6f817b]">Loading order history...</p>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d8e3de] bg-[#f8fbf9] p-8 text-center text-sm text-[#6f817b]">
              {orders.length === 0
                ? 'No orders yet. Place your first order to see it here.'
                : 'No orders match your search or filter.'}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {pagedOrders.map((order, index) => (
                  <CustomerOrderCard
                    key={order.orderId}
                    order={order}
                    onRetryPayment={handleRetryPayment}
                    defaultExpanded={index === 0 && page === 0}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-5 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dce8e3] bg-white text-[#0d4a38] disabled:opacity-30"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPage(i)}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-xl border px-2 text-sm font-semibold transition ${
                        i === page
                          ? 'border-[#0d4a38] bg-[#0d4a38] text-white'
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
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dce8e3] bg-white text-[#0d4a38] disabled:opacity-30"
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </CustomerAccountLayout>

      {selectedOrderForPayment && (
        <PaymentModal
          orderId={selectedOrderForPayment.orderId}
          totalAmount={selectedOrderForPayment.totalAmount}
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={({ orderId, latestStatus, timedOut }) =>
            navigate(buildOrderSuccessPath(orderId, latestStatus?.paymentStatus), {
              state: {
                orderId,
                paymentStatusSnapshot: latestStatus?.paymentStatus || null,
                chargeUpdatedEventReceived: Boolean(latestStatus?.chargeUpdatedEventReceived),
                webhookWaitTimedOut: timedOut,
              },
            })
          }
        />
      )}
    </>
  );
}

function buildOrderSuccessPath(orderId, paymentStatus) {
  const params = new URLSearchParams({ orderId: String(orderId) });
  if (paymentStatus) {
    params.set('paymentStatus', paymentStatus);
  }
  return `/order-success?${params.toString()}`;
}
