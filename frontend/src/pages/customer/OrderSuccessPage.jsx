/**
 * Page Layer – Order confirmation page.
 * Route: /order-success
 *
 * This page intentionally supports multiple retrieval paths to remain resilient:
 * - query param orderId (refresh-safe)
 * - navigation state (ephemeral fallback)
 * - session storage (reload backup for the latest successful order context)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/customer/Breadcrumbs';
import MobileBottomNav from '../../components/customer/MobileBottomNav';
import PaymentModal from '../../components/PaymentModal';
import { useAuth } from '../../context/AuthContext';
import { resolveOrderForSuccess } from '../../services/orderService';
import { formatAmount } from '../../utils/priceUtils';

const PAGE_STATE = {
  LOADING: 'loading',
  SUCCESS: 'success',
  EMPTY: 'empty',
  ERROR: 'error',
  UNAUTHORIZED: 'unauthorized',
};

const PAYMENT_VIEW = {
  SUCCESS: 'success',
  FAILED: 'failed',
  NEUTRAL: 'neutral',
};

const PAYMENT_STATUS_SET = {
  SUCCESS: new Set(['SUCCESS', 'SUCCEEDED', 'COMPLETED', 'PAID']),
  FAILED: new Set(['FAILED', 'FAILURE', 'DECLINED', 'CANCELED', 'CANCELLED', 'EXPIRED', 'PENDING', 'PROCESSING', 'IN_PROGRESS', 'REQUIRES_ACTION']),
};

const ORDER_STATUS_SET = {
  CONFIRMED: new Set(['CONFIRMED', 'READY', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED']),
};


export default function OrderSuccessPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const stateOrder = location.state?.order ?? null;
  const stateOrderId = location.state?.orderId ?? stateOrder?.orderId ?? null;
  const queryOrderId = searchParams.get('orderId');
  const effectiveOrderId = queryOrderId ?? stateOrderId;

  const [pageState, setPageState] = useState(PAGE_STATE.LOADING);
  const [order, setOrder] = useState(stateOrder);
  const [errorMessage, setErrorMessage] = useState('Unable to load order details.');
  const [copied, setCopied] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const latestRequestIdRef = useRef(0);

  const loadOrder = useCallback(async ({ preserveCurrentView = false } = {}) => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (!preserveCurrentView) {
      setPageState(PAGE_STATE.LOADING);
    }
    setErrorMessage('Unable to load order details.');

    if (!effectiveOrderId && !stateOrder) {
      setOrder(null);
      setPageState(PAGE_STATE.EMPTY);
      return;
    }

    const requestId = Date.now();
    latestRequestIdRef.current = requestId;

    // Preserve a trustworthy paid+confirmed snapshot while live refresh runs.
    if (isConfirmedPaidState(stateOrder)) {
      setOrder(stateOrder);
      setPageState(PAGE_STATE.SUCCESS);
    }

    try {
      const resolved = await resolveOrderForSuccess({ orderId: effectiveOrderId });

      if (latestRequestIdRef.current !== requestId) {
        return;
      }

      if (resolved.unauthorized) {
        setOrder(null);
        setPageState(PAGE_STATE.UNAUTHORIZED);
        return;
      }

      if (!resolved.order) {
        if (isConfirmedPaidState(stateOrder)) {
          setOrder(stateOrder);
          setPageState(PAGE_STATE.SUCCESS);
          return;
        }

        console.info('order_success_empty_state', {
          path: location.pathname,
          hasOrderId: Boolean(effectiveOrderId),
        });
        setOrder(null);
        setPageState(PAGE_STATE.EMPTY);
        return;
      }

      setOrder(resolved.order);
      setPageState(PAGE_STATE.SUCCESS);
    } catch (error) {
      if (latestRequestIdRef.current !== requestId) {
        return;
      }

      if (error?.response?.status === 403) {
        setOrder(null);
        setPageState(PAGE_STATE.UNAUTHORIZED);
        return;
      }

      setErrorMessage(error?.response?.data?.message || 'Unable to load order details.');

      if (isConfirmedPaidState(stateOrder)) {
        setOrder(stateOrder);
        setPageState(PAGE_STATE.SUCCESS);
        toast.error('Live refresh failed. Showing saved confirmed order details.');
        return;
      }

      setOrder(null);
      setPageState(PAGE_STATE.ERROR);
    }
  }, [isAuthenticated, navigate, effectiveOrderId, location.pathname, stateOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrder();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadOrder]);



  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const createdAt = order?.createdAt;

  const deliveryEstimate = useMemo(() => {
    if (!createdAt) return 'Delivery estimate unavailable';
    const start = new Date(createdAt);
    const end = new Date(createdAt);
    start.setDate(start.getDate() + 2);
    end.setDate(end.getDate() + 4);

    return `${formatDate(start)} - ${formatDate(end)}`;
  }, [createdAt]);

  const paymentView = useMemo(() => resolvePaymentView(order), [order]);
  const tone = useMemo(() => getToneStyles(paymentView), [paymentView]);
  const statusContent = useMemo(() => getStatusContent(paymentView), [paymentView]);

  const handleCopyOrderId = async () => {
    if (!order?.orderId) return;

    try {
      await navigator.clipboard.writeText(String(order.orderId));
      setCopied(true);
    } catch {
      toast.error('Unable to copy order ID.');
    }
  };

  const handlePaymentModalSuccess = () => {
    toast.success('Payment completed successfully!');
    setIsPaymentModalOpen(false);
    loadOrder({ preserveCurrentView: false });
  };

  return (
    <div className={`min-h-screen flex flex-col ${tone.pageBg}`}>
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 pb-24 sm:py-10 md:px-8 md:pb-8" aria-live="polite">
        <Breadcrumbs
          items={[
            { label: 'Products', to: '/products' },
            { label: 'Orders', to: '/orders' },
            { label: order?.orderId ? `Order #${order.orderId}` : 'Order Status' },
          ]}
        />

        {pageState === PAGE_STATE.LOADING && <LoadingSkeleton />}

        {pageState === PAGE_STATE.ERROR && (
          <ErrorState message={errorMessage} onRetry={loadOrder} />
        )}

        {pageState === PAGE_STATE.EMPTY && <EmptyState isAuthenticated={isAuthenticated} />}

        {pageState === PAGE_STATE.UNAUTHORIZED && <UnauthorizedState />}

        {pageState === PAGE_STATE.SUCCESS && order && (
          <section aria-labelledby="order-success-heading" className="space-y-6">
            <StatusBanner
              title={statusContent.title}
              subtitle={statusContent.subtitle}
              tone={paymentView}
            />

            <div className={`bg-white rounded-2xl shadow-sm border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${tone.orderCardBorder}`}>
              <div>
                <p className="text-xs uppercase tracking-widest text-[#7e8d87] font-semibold">Order ID</p>
                <p className={`text-3xl font-extrabold ${tone.orderIdText}`}>#{order.orderId}</p>
                <p className="text-xs text-[#7e8d87] mt-1">
                  Payment status: <span className="font-semibold text-[#163a2f]">{formatPaymentStatus(order)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyOrderId}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors ${tone.primaryButton}`}
                aria-label="Copy order id"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="9" width="13" height="13" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                {copied ? 'Copied!' : 'Copy Order ID'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
              <OrderSummary order={order} />
              <div className="space-y-6">
                <StatusInfoCard
                  paymentView={paymentView}
                  deliveryEstimate={deliveryEstimate}
                  deliveryAddress={order.deliveryAddress}
                />
                <OrderDetailsCard order={order} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {paymentView === PAYMENT_VIEW.FAILED ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Retry Payment
                  </button>
                </>
              ) : (
                <Link
                  to="/orders"
                  className={`px-6 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors ${tone.primaryButton}`}
                >
                  View Orders
                </Link>
              )}
              <Link
                to="/products"
                className="px-6 py-2.5 border border-[#e4ebe8] hover:bg-white text-[#163a2f] text-sm font-semibold rounded-xl transition-colors"
              >
                Continue Shopping
              </Link>
            </div>

            {paymentView === PAYMENT_VIEW.FAILED && order && (
              <PaymentModal
                orderId={order.orderId}
                totalAmount={order.totalAmount}
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={handlePaymentModalSuccess}
              />
            )}
          </section>
        )}
      </main>

      <MobileBottomNav activeKey="profile" />
      <Footer />
    </div>
  );
}

function StatusBanner({ title, subtitle, tone }) {
  const styles = getToneStyles(tone);

  return (
    <div className={`bg-white border rounded-2xl shadow-sm p-6 sm:p-8 ${styles.bannerBorder}`}>
      <div className="flex items-start gap-4">
        <span className={`w-12 h-12 rounded-full flex items-center justify-center ${styles.iconBadge}`} aria-hidden="true">
          <StatusIcon tone={tone} />
        </span>
        <div>
          <h1 id="order-success-heading" className={`text-2xl sm:text-3xl font-bold ${styles.titleText}`}>{title}</h1>
          <p className="text-sm sm:text-base text-[#7e8d87] mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function OrderSummary({ order }) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const discount     = Number(order?.discountAmount ?? 0);
  const pointsUsed   = Number(order?.pointsRedeemed ?? 0);
  const subtotal     = Number(order?.totalAmount ?? 0) + discount;

  return (
    <section className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-5 sm:p-6" aria-label="Order summary">
      <h2 className="text-lg font-bold text-[#163a2f] mb-4">Order Summary</h2>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No line items available.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => {
            // lineTotal is always the discounted total (effectiveUnitPrice × qty).
            // Derive effective unit price to avoid unitPrice × qty ≠ lineTotal confusion.
            const effectiveUnitPrice =
              item.quantity > 0
                ? Number(item.lineTotal) / item.quantity
                : Number(item.unitPrice);
            const hasProductDiscount = (item.productDiscountPercentage ?? 0) > 0;

            return (
              <li key={`${item.productName}-${index}`} className="border border-[#e4ebe8] rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#163a2f]">{item.productName || 'Unnamed item'}</p>
                    {hasProductDiscount && (
                      <span className="text-xs bg-[#eaf3ee] text-[#0d4a38] font-semibold px-1.5 py-0.5 rounded">
                        {item.productDiscountPercentage}% OFF
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#0d4a38]">{formatAmount(item.lineTotal ?? 0)}</p>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-[#7e8d87]">
                  <span>Qty: {item.quantity ?? 0}</span>
                  <span>
                    {hasProductDiscount ? (
                      <>
                        <span className="line-through text-[#7e8d87] mr-1">{formatAmount(item.unitPrice ?? 0)}</span>
                        <span className="text-[#0d4a38] font-medium">{formatAmount(effectiveUnitPrice)}</span>
                      </>
                    ) : (
                      <span>Unit: {formatAmount(item.unitPrice ?? 0)}</span>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5 pt-4 border-t border-[#e4ebe8] space-y-2">
        {discount > 0 && (
          <>
            <div className="flex items-center justify-between text-sm text-[#7e8d87]">
              <span>Items subtotal</span>
              <span>{formatAmount(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-[#0d4a38] font-medium">
              <span>Loyalty discount ({pointsUsed} pts)</span>
              <span>− {formatAmount(discount)}</span>
            </div>
          </>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-[#163a2f]">Total Amount Paid</span>
          <span className="text-lg font-extrabold text-[#0d4a38]">{formatAmount(order.totalAmount ?? 0)}</span>
        </div>
      </div>
    </section>
  );
}

function StatusInfoCard({ paymentView, deliveryEstimate, deliveryAddress }) {
  if (paymentView === PAYMENT_VIEW.SUCCESS) {
    return (
      <section className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-5 sm:p-6" aria-label="Delivery information">
        <h2 className="text-lg font-bold text-[#163a2f] mb-4">Delivery Info</h2>

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#7e8d87] font-semibold">Estimated Arrival</p>
            <p className="text-sm text-[#163a2f] font-medium mt-1">{deliveryEstimate || 'Delivery estimate unavailable'}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-[#7e8d87] font-semibold">Shipping Address</p>
            <p className="text-sm text-[#163a2f] mt-1 wrap-break-word">
              {deliveryAddress ? maskAddress(deliveryAddress) : 'Address unavailable'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-5 sm:p-6" aria-label="Payment information">
      <h2 className="text-lg font-bold text-[#163a2f] mb-4">What Happens Next</h2>

      {paymentView === PAYMENT_VIEW.FAILED && (
        <div className="space-y-3 text-sm text-[#163a2f]">
          <p>Payment failed. Please try again.</p>
          <p className="text-[#7e8d87]">You can retry from checkout or from your orders page.</p>
        </div>
      )}

      {paymentView === PAYMENT_VIEW.NEUTRAL && (
        <div className="space-y-3 text-sm text-[#163a2f]">
          <p>We are verifying your payment status.</p>
          <p className="text-[#7e8d87]">Please check your orders in a moment for the latest payment update.</p>
        </div>
      )}
    </section>
  );
}

function OrderDetailsCard({ order }) {
  const itemCount = Array.isArray(order?.items)
    ? order.items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0)
    : 0;

  const orderPlacedAt = order?.createdAt
    ? new Date(order.createdAt).toLocaleString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'Unavailable';

  const orderStatus = order?.status ? String(order.status).toUpperCase() : 'UNKNOWN';

  return (
    <section className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-5 sm:p-6" aria-label="Order details">
      <h2 className="text-lg font-bold text-[#163a2f] mb-4">Payment Details</h2>

      <dl className="space-y-3 text-sm">
        <DetailRow label="Order Date" value={orderPlacedAt} />
        <DetailRow label="Payment Method" value={formatPaymentStatus(order)} />
        <DetailRow label="Payment Reference" value={`#${order?.orderId ?? 'N/A'}`} />
      </dl>

      <div className="mt-4 pt-4 border-t border-[#e4ebe8]">
        <p className="text-xs uppercase tracking-widest text-[#7e8d87] font-semibold">Delivery Address</p>
        <p className="text-sm text-[#163a2f] mt-1 wrap-break-word">{order?.deliveryAddress || 'Address unavailable'}</p>
      </div>
    </section>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[#7e8d87]">{label}</dt>
      <dd className="text-[#163a2f] font-medium text-right wrap-break-word">{value}</dd>
    </div>
  );
}

function StatusIcon({ tone }) {
  if (tone === PAYMENT_VIEW.SUCCESS) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-6 h-6">
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (tone === PAYMENT_VIEW.FAILED) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-6 h-6">
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (tone === PAYMENT_VIEW.PENDING) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-6 h-6">
        <path d="M12 8v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12a9 9 0 11-9-9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-6 h-6">
      <path d="M12 9v4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.29 3.86l-8 14A2 2 0 004 21h16a2 2 0 001.71-3.14l-8-14a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function resolvePaymentView(order) {
  const normalizedPaymentStatus = normalizePaymentStatus(order);
  const normalizedOrderStatus = normalizeOrderStatus(order);
  const hasConfirmedOrderStatus = Boolean(
    normalizedOrderStatus && ORDER_STATUS_SET.CONFIRMED.has(normalizedOrderStatus)
  );
  const hasSuccessfulPaymentStatus = Boolean(
    normalizedPaymentStatus && PAYMENT_STATUS_SET.SUCCESS.has(normalizedPaymentStatus)
  );
  const hasFailedPaymentStatus = Boolean(
    normalizedPaymentStatus && PAYMENT_STATUS_SET.FAILED.has(normalizedPaymentStatus)
  );

  // A failed payment status is always authoritative.
  if (hasFailedPaymentStatus) {
    return PAYMENT_VIEW.FAILED;
  }

  // In this domain, CONFIRMED and beyond implies payment success.
  // Trust this signal when payment status is delayed or temporarily stale.
  if (hasConfirmedOrderStatus && (hasSuccessfulPaymentStatus || !normalizedPaymentStatus)) {
    return PAYMENT_VIEW.SUCCESS;
  }

  if (hasSuccessfulPaymentStatus) {
    if (!normalizedOrderStatus || ORDER_STATUS_SET.CONFIRMED.has(normalizedOrderStatus)) {
      return PAYMENT_VIEW.SUCCESS;
    }

    return PAYMENT_VIEW.FAILED;
  }

  if (!normalizedPaymentStatus) return PAYMENT_VIEW.NEUTRAL;

  return PAYMENT_VIEW.NEUTRAL;
}

function normalizePaymentStatus(order) {
  const rawStatus = order?.paymentStatus ?? order?.payment?.paymentStatus ?? order?.payment?.status;

  if (rawStatus === undefined || rawStatus === null) return null;
  return String(rawStatus).trim().toUpperCase();
}

function normalizeOrderStatus(order) {
  const rawStatus = order?.status ?? order?.orderStatus;

  if (rawStatus === undefined || rawStatus === null) return null;
  return String(rawStatus).trim().toUpperCase();
}

function isConfirmedPaidState(order) {
  if (!order) return false;

  const paymentStatus = normalizePaymentStatus(order);
  const orderStatus = normalizeOrderStatus(order);

  return PAYMENT_STATUS_SET.SUCCESS.has(paymentStatus) && ORDER_STATUS_SET.CONFIRMED.has(orderStatus);
}

function formatPaymentStatus(order) {
  const normalized = normalizePaymentStatus(order);
  if (!normalized) return 'VERIFICATION_REQUIRED';
  return normalized;
}

function getStatusContent(paymentView) {
  if (paymentView === PAYMENT_VIEW.SUCCESS) {
    return {
      title: 'Order Confirmed',
      subtitle: 'Payment received successfully. We are preparing your items now.',
    };
  }

  if (paymentView === PAYMENT_VIEW.FAILED) {
    return {
      title: 'Payment Failed',
      subtitle: 'Payment failed. Please try again.',
    };
  }

  return {
    title: 'Verifying Payment Status',
    subtitle: 'We are verifying your payment status. This page will update after confirmation.',
  };
}

function getToneStyles(paymentView) {
  if (paymentView === PAYMENT_VIEW.SUCCESS) {
    return {
      pageBg: 'bg-[#f5f7f6]',
      bannerBorder: 'border-[#e4ebe8]',
      iconBadge: 'bg-[#eaf3ee] text-[#0d4a38]',
      titleText: 'text-[#163a2f]',
      orderCardBorder: 'border-[#e4ebe8]',
      orderIdText: 'text-[#0d4a38]',
      primaryButton: 'bg-[#0d4a38] hover:bg-[#083a2c]',
    };
  }

  if (paymentView === PAYMENT_VIEW.FAILED) {
    return {
      pageBg: 'bg-[#f5f7f6]',
      bannerBorder: 'border-rose-100',
      iconBadge: 'bg-rose-100 text-rose-700',
      titleText: 'text-rose-800',
      orderCardBorder: 'border-rose-100',
      orderIdText: 'text-rose-700',
      primaryButton: 'bg-rose-600 hover:bg-rose-700',
    };
  }

  return {
    pageBg: 'bg-[#f5f7f6]',
    bannerBorder: 'border-[#e4ebe8]',
    iconBadge: 'bg-[#e4ebe8] text-[#7e8d87]',
    titleText: 'text-[#163a2f]',
    orderCardBorder: 'border-[#e4ebe8]',
    orderIdText: 'text-[#163a2f]',
    primaryButton: 'bg-[#0d4a38] hover:bg-[#083a2c]',
  };
}

function EmptyState({ isAuthenticated }) {
  return (
    <section className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-8 text-center" role="status">
      <h1 className="text-2xl font-bold text-[#163a2f]">No recent order found</h1>
      <p className="text-sm text-[#7e8d87] mt-2">
        We could not find a recent completed order to display.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {isAuthenticated && (
          <Link
            to="/orders"
            className="px-6 py-2.5 bg-[#0d4a38] hover:bg-[#083a2c] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            View Orders
          </Link>
        )}
        <Link
          to="/products"
          className="px-6 py-2.5 border border-[#e4ebe8] hover:bg-[#f5f7f6] text-[#163a2f] text-sm font-semibold rounded-xl transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </section>
  );
}

function UnauthorizedState() {
  return (
    <section className="bg-white rounded-2xl border border-rose-100 shadow-sm p-8 text-center" role="alert">
      <h1 className="text-2xl font-bold text-rose-700">Not authorized</h1>
      <p className="text-sm text-[#7e8d87] mt-2">
        You do not have permission to view this order.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/orders"
          className="px-6 py-2.5 bg-[#0d4a38] hover:bg-[#083a2c] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          View Orders
        </Link>
        <Link
          to="/products"
          className="px-6 py-2.5 border border-[#e4ebe8] hover:bg-[#f5f7f6] text-[#163a2f] text-sm font-semibold rounded-xl transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </section>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <section className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-8 text-center" role="alert">
      <h1 className="text-2xl font-bold text-[#163a2f]">Unable to load order details</h1>
      <p className="text-sm text-[#7e8d87] mt-2">{message}</p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="px-6 py-2.5 bg-[#0d4a38] hover:bg-[#083a2c] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Retry
        </button>
        <Link
          to="/products"
          className="px-6 py-2.5 border border-[#e4ebe8] hover:bg-[#f5f7f6] text-[#163a2f] text-sm font-semibold rounded-xl transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <section aria-label="Loading order details" className="space-y-5 animate-pulse">
      <div className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-8">
        <div className="h-7 w-56 bg-[#e4ebe8] rounded" />
        <div className="h-4 w-80 bg-[#f0f4f2] rounded mt-3" />
      </div>

      <div className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-6">
        <div className="h-5 w-32 bg-[#e4ebe8] rounded" />
        <div className="h-8 w-44 bg-[#f0f4f2] rounded mt-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-6 space-y-3">
          <div className="h-5 w-36 bg-[#e4ebe8] rounded" />
          <div className="h-16 bg-[#f0f4f2] rounded-xl" />
          <div className="h-16 bg-[#f0f4f2] rounded-xl" />
          <div className="h-10 bg-[#f0f4f2] rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-6 space-y-3">
          <div className="h-5 w-36 bg-[#e4ebe8] rounded" />
          <div className="h-12 bg-[#f0f4f2] rounded-xl" />
          <div className="h-12 bg-[#f0f4f2] rounded-xl" />
        </div>
      </div>
    </section>
  );
}

function maskAddress(address) {
  if (!address) return '';
  const trimmed = address.trim();

  if (trimmed.length <= 12) {
    return `${trimmed.slice(0, 3)}***`;
  }

  return `${trimmed.slice(0, 8)}***${trimmed.slice(-8)}`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Intentionally no sessionStorage fallback for order id.
// /order-success should be deterministic from query/state + live backend data.
