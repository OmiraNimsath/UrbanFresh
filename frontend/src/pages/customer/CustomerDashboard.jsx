import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getMyOrders, getLoyaltyPoints } from '../../services/orderService';
import { formatAmount } from '../../utils/priceUtils';
import PaymentModal from '../../components/PaymentModal';
import useNotifications from '../../hooks/useNotifications';

/**
 * Presentation Layer – Customer dashboard page.
 * Displays:
 *   - Order history section: list of past orders with status badges and totals.
 *     Shows an empty state when no orders have been placed yet.
 *   - Loyalty points section: total balance, earned, redeemed, and the conversion rule.
 * Data is loaded in parallel on mount; errors are shown via toast.
 */
export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  /** Load orders and loyalty points in parallel on mount.
   * allSettled ensures partial success: if one call fails, the other section
   * still renders instead of both being hidden by a single catch. */
  useEffect(() => {
    Promise.allSettled([getMyOrders(), getLoyaltyPoints()])
      .then(([ordersResult, loyaltyResult]) => {
        if (ordersResult.status === 'fulfilled') {
          setOrders(ordersResult.value.data);
        } else {
          toast.error('Failed to load your orders. Please refresh.');
        }
        if (loyaltyResult.status === 'fulfilled') {
          setLoyalty(loyaltyResult.value.data);
        } else {
          toast.error('Failed to load loyalty points. Please refresh.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const handleRetryPayment = (order) => {
    setSelectedOrderForPayment(order);
    setPaymentModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-700">UrbanFresh</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Welcome back, <span className="font-semibold text-gray-700">{user?.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/profile"
              className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors"
            >
              My Profile
            </Link>
            <Link
              to="/products"
              className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Shop Now
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* ── Notifications compact tile ── */}
        <button
          onClick={() => setNotificationsOpen(true)}
          className="w-full bg-white rounded-2xl shadow-sm px-6 py-4 flex items-center justify-between hover:shadow-md transition-shadow text-left"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl" aria-hidden="true">🔔</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">Notifications</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {notifications.length === 0
                  ? 'No notifications yet'
                  : unreadCount > 0
                    ? `${unreadCount} unread of ${notifications.length}`
                    : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full px-1">
                {unreadCount}
              </span>
            )}
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {notificationsOpen && (
          <NotificationsOverlay
            notifications={notifications}
            unreadCount={unreadCount}
            markRead={markRead}
            markAllRead={markAllRead}
            onClose={() => setNotificationsOpen(false)}
          />
        )}

        {/* ── Loyalty Points Section ── */}
        {loyalty && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🎁 Loyalty Points</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <LoyaltyStat label="Available Balance" value={loyalty.totalPoints} highlight />
              <LoyaltyStat label="Total Earned" value={loyalty.earnedPoints} />
              <LoyaltyStat label="Redeemed" value={loyalty.redeemedPoints} />
              {/* Redemption tile — points can now be applied in the cart */}
              <div className="bg-green-50 rounded-xl p-4 flex flex-col items-center justify-center border border-green-200">
                <p className="text-2xl mb-1">🛒</p>
                <p className="text-xs text-green-700 font-medium text-center leading-tight">Apply in Cart</p>
                <p className="text-xs text-green-600 text-center mt-0.5">1 pt = Rs. 5 off</p>
              </div>
            </div>
            {/* Conversion rule displayed so customer understands how points accumulate */}
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-2">
              ℹ️ {loyalty.conversionRule}
            </p>
          </div>
        )}

        {/* ── Order History Section ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📦 My Orders</h2>

          {orders.length === 0 ? (
            /* Empty state — acceptance criteria: tested for empty order list */
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🛒</p>
              <p className="text-gray-500 font-medium">No orders yet</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">
                Start shopping to see your order history here.
              </p>
              <Link
                to="/products"
                className="inline-block text-sm bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard 
                  key={order.orderId} 
                  order={order}
                  onRetryPayment={handleRetryPayment}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Payment Retry Modal */}
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
    </div>
  );
}

/* ── Sub-components ── */

/**
 * Displays a single loyalty stat tile.
 * @param {string}  label     - stat label shown below the number
 * @param {number}  value     - numeric point value
 * @param {boolean} highlight - uses green background for the primary balance tile
 */
function LoyaltyStat({ label, value, highlight = false }) {
  return (
    <div className={`rounded-xl p-4 text-center ${highlight ? 'bg-green-600 text-white' : 'bg-gray-50'}`}>
      <p className={`text-2xl font-bold ${highlight ? 'text-white' : 'text-green-700'}`}>
        {value}
      </p>
      <p className={`text-xs mt-1 ${highlight ? 'text-green-100' : 'text-gray-500'}`}>
        {label}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications overlay modal
// ─────────────────────────────────────────────────────────────────────────────

function NotificationsOverlay({ notifications, unreadCount, markRead, markAllRead, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full px-1">
                {unreadCount}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-green-600 hover:text-green-800 font-medium transition-colors"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close notifications"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-xl px-4 py-3 ${
                  n.read ? 'bg-gray-50' : 'bg-green-50 border border-green-100'
                }`}
              >
                <span className="text-base mt-0.5" aria-hidden="true">
                  {n.read ? '📭' : '📬'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(n.createdAt).toLocaleString('en-LK', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-xs text-green-600 hover:text-green-800 font-medium whitespace-nowrap mt-0.5 transition-colors"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Displays a single order row with status badge, total, and expandable item list.
 * @param {{ orderId, status, deliveryAddress, totalAmount, createdAt, items[] }} order
 * @param {function} onRetryPayment - callback for retry payment button
 */
function OrderCard({ order, onRetryPayment }) {
  const [expanded, setExpanded] = useState(false);
  const paymentStatus = normalizePaymentStatus(order?.paymentStatus);
  const canRetryPayment = (paymentStatus === 'PENDING' || paymentStatus === 'FAILED') && Boolean(onRetryPayment);

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      {/* Order summary row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">Order #{order.orderId}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-800">
            {formatAmount(order.totalAmount)}
          </span>
          <PaymentBadge paymentStatus={paymentStatus} />
          <StatusBadge status={order.status} />
            {canRetryPayment && (
              <button
                onClick={() => onRetryPayment(order)}
                aria-label="Retry payment"
                title="Retry payment"
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                  <polyline points="21 3 21 9 15 9" />
                </svg>
              </button>
            )}
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs text-green-600 hover:text-green-800 font-medium transition-colors"
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {/* Expandable line-item breakdown */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">📍 {order.deliveryAddress}</p>
          <table className="w-full text-xs text-gray-600">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left pb-1 font-medium">Product</th>
                <th className="text-right pb-1 font-medium">Qty</th>
                <th className="text-right pb-1 font-medium">Unit Price</th>
                <th className="text-right pb-1 font-medium">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => {
                // Derive the effective (discounted) unit price from the line total.
                // unitPrice is the original snapshot; lineTotal already reflects the
                // product discount, so effectiveUnitPrice = lineTotal / qty.
                const effectiveUnitPrice =
                  item.quantity > 0
                    ? Number(item.lineTotal) / item.quantity
                    : Number(item.unitPrice);
                const hasProductDiscount =
                  item.productDiscountPercentage > 0;

                return (
                  <>
                    <tr key={idx} className="border-t border-gray-50">
                      <td className="py-1">
                        {item.productName}
                        {hasProductDiscount && (
                          <span className="ml-1 text-green-600 font-medium">
                            ({item.productDiscountPercentage}% OFF)
                          </span>
                        )}
                      </td>
                      <td className="text-right py-1">{item.quantity}</td>
                      <td className="text-right py-1">
                        {hasProductDiscount ? (
                          <span>
                            <span className="line-through text-gray-400 mr-1">
                              {formatAmount(item.unitPrice)}
                            </span>
                            <span className="text-green-700">{formatAmount(effectiveUnitPrice)}</span>
                          </span>
                        ) : (
                          formatAmount(item.unitPrice)
                        )}
                      </td>
                      <td className="text-right py-1">{formatAmount(item.lineTotal)}</td>
                    </tr>
                    {item.batchAllocations?.length > 0 && (
                      <tr key={`${idx}-batches`} className="border-t border-gray-50 bg-gray-50">
                        <td colSpan={4} className="py-1 px-2">
                          <div className="flex flex-wrap gap-2">
                            {item.batchAllocations.map((alloc, ai) => (
                              <span
                                key={ai}
                                className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-500"
                              >
                                <span className="font-medium text-gray-700">{alloc.batchNumber}</span>
                                {alloc.expiryDate && <span>· exp {alloc.expiryDate}</span>}
                                <span>· qty {alloc.allocatedQuantity}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>

          {Number(order.discountAmount) > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Items subtotal</span>
                <span>{formatAmount(Number(order.totalAmount) + Number(order.discountAmount))}</span>
              </div>
              <div className="flex justify-between text-green-700 font-medium">
                <span>🎁 Loyalty discount ({order.pointsRedeemed} pts)</span>
                <span>− {formatAmount(order.discountAmount)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Coloured pill badge for order status.
 * Mirrors current backend status values while keeping graceful fallback styling.
 */
function StatusBadge({ status }) {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    READY: 'bg-green-100 text-green-700',
    OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
    DELIVERED: 'bg-emerald-100 text-emerald-700',
    RETURNED: 'bg-orange-100 text-orange-700',
    CANCELLED: 'bg-red-100 text-red-600',
    CONFIRMED: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      ORD: {status}
    </span>
  );
}

function PaymentBadge({ paymentStatus }) {
  const styles = {
    PAID: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    PENDING: 'bg-red-100 text-red-700',
  };

  const normalized = paymentStatus || 'FAILED';

  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${styles[normalized] ?? 'bg-gray-100 text-gray-600'}`}>
      PAY: {normalized === 'PENDING' ? 'FAILED' : normalized}
    </span>
  );
}

function normalizePaymentStatus(rawStatus) {
  if (rawStatus === null || rawStatus === undefined) return null;
  return String(rawStatus).trim().toUpperCase();
}

function buildOrderSuccessPath(orderId, paymentStatus) {
  const params = new URLSearchParams({ orderId: String(orderId) });
  if (paymentStatus) {
    params.set('paymentStatus', paymentStatus);
  }
  return `/order-success?${params.toString()}`;
}

/** Format ISO datetime string to a human-readable local date. */
function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-LK', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}
