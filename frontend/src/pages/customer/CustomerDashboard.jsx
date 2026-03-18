import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getMyOrders, getLoyaltyPoints } from '../../services/orderService';
import { formatAmount } from '../../utils/priceUtils';
import PaymentModal from '../../components/PaymentModal';

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

        {/* ── Loyalty Points Section ── */}
        {loyalty && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🎁 Loyalty Points</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <LoyaltyStat label="Available Balance" value={loyalty.totalPoints} highlight />
              <LoyaltyStat label="Total Earned" value={loyalty.earnedPoints} />
              <LoyaltyStat label="Redeemed" value={loyalty.redeemedPoints} />
              {/* Placeholder tile for redemption — reserved for future sprint */}
              <div className="bg-green-50 rounded-xl p-4 flex flex-col items-center justify-center border border-dashed border-green-300">
                <p className="text-xs text-green-600 font-medium text-center">Redeem coming soon</p>
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
          onSuccess={() => navigate(`/payment-result?status=success&orderId=${selectedOrderForPayment.orderId}`)}
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

/**
 * Displays a single order row with status badge, total, and expandable item list.
 * @param {{ orderId, status, deliveryAddress, totalAmount, createdAt, items[] }} order
 * @param {function} onRetryPayment - callback for retry payment button
 */
function OrderCard({ order, onRetryPayment }) {
  const [expanded, setExpanded] = useState(false);

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
          <StatusBadge status={order.status} />
            {order.status === 'PENDING' && onRetryPayment && (
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
              {order.items.map((item, idx) => (
                <tr key={idx} className="border-t border-gray-50">
                  <td className="py-1">{item.productName}</td>
                  <td className="text-right py-1">{item.quantity}</td>
                  <td className="text-right py-1">{formatAmount(item.unitPrice)}</td>
                  <td className="text-right py-1">{formatAmount(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
      {status}
    </span>
  );
}

/** Format ISO datetime string to a human-readable local date. */
function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-LK', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}
