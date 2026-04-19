import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getLoyaltyPoints, getMyOrders, getRecommendations } from '../../services/orderService';
import { formatAmount } from '../../utils/priceUtils';
import PaymentModal from '../../components/PaymentModal';
import useNotifications from '../../hooks/useNotifications';
import CustomerAccountLayout from '../../components/customer/CustomerAccountLayout';
import CustomerOrderCard from '../../components/customer/CustomerOrderCard';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [orders, setOrders] = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    Promise.allSettled([getMyOrders(), getLoyaltyPoints(), getRecommendations()])
      .then(([ordersResult, loyaltyResult, recsResult]) => {
        if (ordersResult.status === 'fulfilled') {
          setOrders(ordersResult.value);
        } else {
          toast.error('Failed to load your orders. Please refresh.');
        }

        if (loyaltyResult.status === 'fulfilled') {
          setLoyalty(loyaltyResult.value);
        } else {
          toast.error('Failed to load loyalty points. Please refresh.');
        }

        if (recsResult.status === 'fulfilled') {
          setRecommendations(recsResult.value);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Customer';

  const recentOrders = orders.slice(0, 3);

  const handleRetryPayment = (order) => {
    setSelectedOrderForPayment(order);
    setPaymentModalOpen(true);
  };

  const handleAddRecommended = async (productId, name) => {
    try {
      await addToCart(productId, 1);
      toast.success(`${name} added to cart`);
    } catch {
      toast.error('Could not add to cart. Please try again.');
    }
  };

  const rightAside = (
    <>
      <button
        onClick={() => setNotificationsOpen(true)}
        className="w-full rounded-2xl border border-[#e4ebe8] bg-white p-4 text-left shadow-sm transition-colors hover:bg-[#f8fbf9]"
        aria-label={`Open notifications${unreadCount > 0 ? ` with ${unreadCount} unread` : ''}`}
      >
        <p className="text-xs uppercase tracking-wide text-[#7e8d87]">Notifications</p>
        <p className="mt-1 text-2xl font-semibold text-[#163a2f]">{unreadCount}</p>
        <p className="mt-1 text-xs text-[#6f817b]">Unread updates waiting for review</p>
      </button>

      {loyalty && (
        <div className="hidden xl:block rounded-2xl bg-[#0d4a38] p-4 text-white shadow-sm">
          <p className="text-xs uppercase tracking-wide text-[#b4d2c5]">Loyalty Points</p>
          <p className="mt-1 text-3xl font-semibold">{loyalty.totalPoints}</p>
          <p className="mt-1 text-xs text-[#d6e8df]">Use points at checkout for instant discounts.</p>
          <Link
            to="/loyalty"
            className="mt-3 inline-flex rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#0d4a38]"
          >
            View my history
          </Link>
        </div>
      )}

      <div className="rounded-2xl border border-[#e4ebe8] bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-[#1d3a2f]">Quick links</p>
        <div className="mt-3 grid gap-2">
          <Link to="/products" className="rounded-lg bg-[#f5f8f6] px-3 py-2 text-sm text-[#355f4d]">Browse products</Link>
          <Link to="/orders" className="rounded-lg bg-[#f5f8f6] px-3 py-2 text-sm text-[#355f4d]">Order history</Link>
          <Link to="/profile" className="rounded-lg bg-[#f5f8f6] px-3 py-2 text-sm text-[#355f4d]">Profile settings</Link>
        </div>
      </div>
    </>
  );

  return (
    <>
      <CustomerAccountLayout
        userName={user?.name}
        activeSection="dashboard"
        mobileActiveKey="orders"
        title={`Hello, ${firstName}!`}
        subtitle="Quick glance at your loyalty rewards, orders, and personalized actions."
        breadcrumbItems={[{ label: 'Dashboard' }]}
        rightAside={rightAside}
      >
        <section className="overflow-hidden rounded-2xl bg-[#0d4a38] p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#b6d4c7]">UrbanFresh Customer Space</p>
              <h2 className="mt-2 text-2xl font-semibold">Your groceries, delivered smarter.</h2>
              <p className="mt-2 max-w-xl text-sm text-[#d5e7de]">
                Track recent orders, review loyalty benefits, and continue shopping in one place.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/products"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0d4a38]"
              >
                Shop Now
              </Link>
              <Link
                to="/profile"
                className="rounded-lg border border-[#5f8f7a] px-4 py-2 text-sm font-semibold text-white"
              >
                My Profile
              </Link>
            </div>
          </div>
        </section>

        {loyalty && (
          <section className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#163a2f]">Loyalty Points</h3>
              <Link
                to="/loyalty"
                className="text-sm font-medium text-[#2f6550] hover:text-[#0d4a38]"
              >
                View history
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricTile label="Available" value={loyalty.totalPoints} emphasized />
              <MetricTile label="Total Earned" value={loyalty.earnedPoints} />
              <MetricTile label="Redeemed" value={loyalty.redeemedPoints} />
              <MetricTile label="Value" value={`Rs. ${Number(loyalty.totalPoints || 0) * 5}`} />
            </div>
          </section>
        )}

        {recommendations.length > 0 && (
          <section className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#163a2f]">Buy Again</h3>
              <Link to="/products" className="text-sm font-medium text-[#2f6550] hover:text-[#0d4a38]">Browse all</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {recommendations.slice(0, 4).map((rec) => (
                <article key={rec.productId} className="rounded-xl border border-[#e8eeeb] bg-[#fbfdfc] p-3">
                  <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg bg-[#eef4f1]">
                    {rec.imageUrl ? (
                      <img
                        src={rec.imageUrl}
                        alt={rec.name}
                        className="h-full w-full object-cover"
                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-2xl" aria-hidden="true">🥬</span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-medium text-[#355f4d]">{rec.name}</p>
                  <p className="mt-1 text-sm font-semibold text-[#163a2f]">{formatAmount(rec.price)}</p>
                  <button
                    onClick={() => handleAddRecommended(rec.productId, rec.name)}
                    className="mt-2 w-full rounded-lg bg-[#0d4a38] px-2 py-1.5 text-xs font-medium text-white"
                  >
                    Add to cart
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#163a2f]">Recent Orders</h3>
            <Link to="/orders" className="text-sm font-medium text-[#2f6550] hover:text-[#0d4a38]">
              View all
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-[#6f817b]">Loading your dashboard...</p>
          ) : recentOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d8e3de] bg-[#f8fbf9] p-8 text-center">
              <p className="text-sm font-medium text-[#48665c]">No orders yet</p>
              <p className="mt-1 text-xs text-[#789088]">Place your first order to start tracking deliveries here.</p>
              <Link to="/products" className="mt-4 inline-flex rounded-lg bg-[#0d4a38] px-4 py-2 text-sm font-medium text-white">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <CustomerOrderCard
                  key={order.orderId}
                  order={order}
                  onRetryPayment={handleRetryPayment}
                />
              ))}
            </div>
          )}
        </section>
      </CustomerAccountLayout>

      {notificationsOpen && (
        <NotificationsOverlay
          notifications={notifications}
          unreadCount={unreadCount}
          markRead={markRead}
          markAllRead={markAllRead}
          onClose={() => setNotificationsOpen(false)}
        />
      )}

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

function MetricTile({ label, value, emphasized = false }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        emphasized
          ? 'border-[#cae3d6] bg-[#eaf5ef]'
          : 'border-[#e4ebe8] bg-white'
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-[#7c8b85]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${emphasized ? 'text-[#0d4a38]' : 'text-[#1d3a2f]'}`}>
        {value}
      </p>
    </div>
  );
}

function NotificationsOverlay({ notifications, unreadCount, markRead, markAllRead, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
    >
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-md sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-[#edf2ef] px-5 py-4">
          <h2 className="text-base font-semibold text-[#1d3a2f]">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#0d4a38] px-1 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-[#2f6550] hover:text-[#0d4a38]"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close notifications"
              className="text-sm text-[#6f817b] hover:text-[#1d3a2f]"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {notifications.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#7c8b85]">No notifications yet</p>
          ) : (
            notifications.map((item) => (
              <article
                key={item.id}
                className={`rounded-xl px-4 py-3 ${
                  item.read ? 'bg-[#f8fbf9]' : 'border border-[#cae3d6] bg-[#eaf5ef]'
                }`}
              >
                <p className="text-sm text-[#355f4d]">{item.message}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-[#7c8b85]">
                    {new Date(item.createdAt).toLocaleString('en-LK', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  {!item.read && (
                    <button
                      onClick={() => markRead(item.id)}
                      className="text-xs font-medium text-[#2f6550] hover:text-[#0d4a38]"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function buildOrderSuccessPath(orderId, paymentStatus) {
  const params = new URLSearchParams({ orderId: String(orderId) });
  if (paymentStatus) {
    params.set('paymentStatus', paymentStatus);
  }
  return `/order-success?${params.toString()}`;
}
