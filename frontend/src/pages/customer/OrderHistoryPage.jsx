import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import CustomerAccountLayout from '../../components/customer/CustomerAccountLayout';
import CustomerOrderCard from '../../components/customer/CustomerOrderCard';
import PaymentModal from '../../components/PaymentModal';
import { getMyOrders } from '../../services/orderService';

const FILTERS = ['ALL', 'DELIVERED', 'PENDING', 'CANCELLED'];

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);

  useEffect(() => {
    getMyOrders()
      .then((response) => setOrders(Array.isArray(response.data) ? response.data : []))
      .catch(() => toast.error('Failed to load order history.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'ALL') return orders;
    return orders.filter((order) => String(order.status || '').toUpperCase() === activeFilter);
  }, [activeFilter, orders]);

  const hasFilterApplied = activeFilter !== 'ALL';

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
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  activeFilter === filter
                    ? 'bg-[#0d4a38] text-white'
                    : 'bg-[#f1f5f3] text-[#567067] hover:bg-[#e9efec]'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter.toLowerCase()}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-[#6f817b]">Loading order history...</p>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d8e3de] bg-[#f8fbf9] p-8 text-center text-sm text-[#6f817b]">
              {hasFilterApplied
                ? 'No orders found for this filter.'
                : 'No orders yet. Place your first order to see it here.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order, index) => (
                <CustomerOrderCard
                  key={order.orderId}
                  order={order}
                  onRetryPayment={handleRetryPayment}
                  defaultExpanded={index === 0}
                />
              ))}
            </div>
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
