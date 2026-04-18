/**
 * Page Layer – Checkout page.
 * Connects cart → order placement → Stripe payment in two steps:
 *   Step 1 (address): confirm delivery address, then place the order.
 *   Step 2 (payment): Stripe PaymentElement collects card details and confirms payment.
 *
 * Styling follows the site-wide green-50 / white card / green-600 convention
 * matching CartPage, CustomerDashboard, and ProfilePage.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/customer/Breadcrumbs';
import MobileBottomNav from '../../components/customer/MobileBottomNav';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { placeOrder } from '../../services/orderService';
import {
  createPaymentIntent,
  waitForChargeUpdatedAndFetchLatest,
} from '../../services/paymentService';
import { formatAmount } from '../../utils/priceUtils';
import { getApiErrorMessage } from '../../utils/errorMessageUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Page root
// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { cart, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [addressError, setAddressError] = useState('');

  // Loyalty points passed from CartPage via navigation state
  const pointsToRedeem = location.state?.pointsToRedeem ?? 0;

  const [orderId, setOrderId]             = useState(null);
  const [orderTotal, setOrderTotal]       = useState(0);   // snapshot before cart is cleared
  const [orderDiscount, setOrderDiscount] = useState(0);   // snapshot of loyalty discount applied
  const [orderItemsSnapshot, setOrderItemsSnapshot] = useState([]); // snapshot of items
  const [orderSnapshot, setOrderSnapshot] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret]   = useState(null);

  const [step, setStep]       = useState('address'); // 'address' | 'payment'
  const [loading, setLoading] = useState(false);

  // Guard: redirect to cart only when genuinely empty with no order in progress
  useEffect(() => {
    if (!cartLoading && !loading && cart.items.length === 0 && !orderId) {
      navigate('/cart');
    }
  }, [cartLoading, loading, cart.items.length, orderId, navigate]);

  const handleProceedToPayment = async () => {
    if (!deliveryAddress.trim()) {
      setAddressError('Delivery address is required.');
      return;
    }
    setAddressError('');
    setLoading(true);

    try {
      const orderItems = cart.items.map((item) => ({
        productId: item.productId,
        quantity:  item.quantity,
      }));

      // Place order first (pass loyalty points to redeem)
      const order = await placeOrder(deliveryAddress.trim(), orderItems, pointsToRedeem);

      // Create PaymentIntent with the new orderId
      const { clientSecret: secret, publishableKey } = await createPaymentIntent(order.orderId);

      // Commit all state before clearing cart.
      // Snapshot totalAmount NOW — cart.totalAmount becomes 0 after clearCart().
      setStripePromise(loadStripe(publishableKey));
      setClientSecret(secret);
      setOrderId(order.orderId);
      setOrderTotal(order.totalAmount);     // ← already discounted
      setOrderDiscount(order.discountAmount ?? 0);
      setOrderItemsSnapshot(order.items);   // ← capture items from order response
      setOrderSnapshot(order);
      setStep('payment');

      // Cart cleared after step flip (stock already reserved)
      await clearCart();
    } catch (err) {
      const msg = getApiErrorMessage(err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f6] flex flex-col">
      <Navbar />

      <div className="flex-1 w-full pb-24 md:pb-8">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
        <Breadcrumbs
          items={[
            { label: 'Products', to: '/products' },
            { label: 'Cart', to: '/cart' },
            { label: 'Checkout' },
          ]}
        />

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#163a2f] md:text-4xl">Checkout</h1>
          <Link to="/cart" className="text-sm text-[#0d4a38] hover:underline flex items-center gap-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Back to Cart
          </Link>
        </div>

        {/* ── Step progress ── */}
        <div className="flex items-center gap-2 mb-8">
          <StepPill num={1} label="Delivery Address" active={step === 'address'} done={step === 'payment'} />
          <div className={`flex-1 h-0.5 rounded ${step === 'payment' ? 'bg-[#0d4a38]' : 'bg-[#e4ebe8]'}`} />
          <StepPill num={2} label="Payment" active={step === 'payment'} done={false} />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Left: form ── */}
          <div className="flex-1">
            {step === 'address' && (
              <AddressStep
                cart={cart}
                deliveryAddress={deliveryAddress}
                setDeliveryAddress={setDeliveryAddress}
                addressError={addressError}
                loading={loading}
                onProceed={handleProceedToPayment}
              />
            )}

            {step === 'payment' && clientSecret && stripePromise && (
              <Elements stripe={stripePromise}>
                <PaymentStep
                  orderId={orderId}
                  total={orderTotal}
                  clientSecret={clientSecret}
                  orderSnapshot={orderSnapshot}
                />
              </Elements>
            )}
          </div>

          {/* ── Right: order summary ── */}
          <OrderSummaryPanel
            cart={cart}
            orderTotal={orderTotal}
            orderDiscount={orderDiscount}
            orderSnapshot={orderSnapshot}
            pointsToRedeem={pointsToRedeem}
            orderItemsSnapshot={orderItemsSnapshot}
            deliveryAddress={deliveryAddress}
            showAddress={step === 'payment'}
          />
        </div>
      </div>
      </div>

      <MobileBottomNav activeKey="cart" />
      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 – Address form
// ─────────────────────────────────────────────────────────────────────────────

function AddressStep({ deliveryAddress, setDeliveryAddress, addressError, loading, onProceed, cart }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-6">
      <h2 className="text-lg font-bold text-[#163a2f] mb-1">Delivery Address</h2>
      <p className="text-sm text-[#7e8d87] mb-5">
        Confirm where your order should be delivered.
      </p>

      <div className="mb-5">
        <label htmlFor="delivery-address" className="block text-xs font-semibold uppercase tracking-widest text-[#7e8d87] mb-1">
          Street Address <span className="text-red-400">*</span>
        </label>
        <textarea
          id="delivery-address"
          rows={3}
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          disabled={loading}
          placeholder="Enter your full apartment address, block number, and street name..."
          className={`w-full px-4 py-3 border rounded-xl text-sm text-[#163a2f] focus:outline-none focus:ring-2 focus:ring-[#0d4a38] transition resize-none ${
            addressError ? 'border-red-400' : 'border-[#e4ebe8]'
          }`}
        />
        {addressError && (
          <p className="text-xs text-red-500 mt-1">{addressError}</p>
        )}
        <p className="text-xs text-[#7e8d87] mt-1">
          Pre-filled from your profile — edit if delivering elsewhere.
        </p>
      </div>

      <div className="mb-5 rounded-xl border border-[#eaf3ee] bg-[#f5f7f6] px-4 py-3 flex items-center gap-2 text-sm text-[#0d4a38]">
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" /></svg>
        Your delivery will be made in 100% biodegradable packaging.
      </div>

      <button
        id="proceed-to-payment-btn"
        onClick={onProceed}
        disabled={loading || cart.items.length === 0}
        className="w-full py-3 bg-[#0d4a38] hover:bg-[#083a2c] disabled:opacity-50 text-white font-semibold rounded-xl active:scale-95 transition-all"
      >
        {loading ? 'Placing order…' : 'Place Order & Pay'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 – Stripe payment form (must be inside <Elements>)
// ─────────────────────────────────────────────────────────────────────────────

function PaymentStep({ orderId, total, clientSecret, orderSnapshot }) {
  const stripe   = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [paying, setPaying] = useState(false);
  const [stripeError, setStripeError] = useState(null);
  const [paymentPhase, setPaymentPhase] = useState('idle');
  const [liveStatus, setLiveStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setStripeError(null);
    setLiveStatus(null);
    setPaymentPhase('confirming');

    const cardElement = elements.getElement(CardElement);

    try {
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        setStripeError(error.message || 'Payment could not be confirmed. Please try again.');
        setPaying(false);
        setPaymentPhase('idle');
        return;
      }

      setPaymentPhase('awaiting-webhook');
      const { latestStatus, timedOut } = await waitForChargeUpdatedAndFetchLatest({
        orderId,
        timeoutMs: 15000,
        pollIntervalMs: 1500,
        onUpdate: setLiveStatus,
      });

      setPaymentPhase('resolving');

      if (timedOut) {
        toast('Payment confirmation is taking longer than expected. Please try again.', {
          icon: '⏳',
        });
      }

      navigate(buildOrderSuccessPath(orderId, latestStatus?.paymentStatus), {
        state: {
          orderId,
          order: orderSnapshot || null,
          paymentStatusSnapshot: latestStatus?.paymentStatus || null,
          chargeUpdatedEventReceived: Boolean(latestStatus?.chargeUpdatedEventReceived),
          webhookWaitTimedOut: timedOut,
        },
      });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to finalize payment status. Please try again.');
      setStripeError(message);
      toast.error(message);
      setPaying(false);
      setPaymentPhase('idle');
    }
  };

  const progressLabel = resolveProgressLabel(paymentPhase, liveStatus?.paymentStatus);
  const isBusy = paying;

  return (
    <div className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-6">
      <h2 className="text-lg font-bold text-[#163a2f] mb-1">Secure Payment</h2>
      <p className="text-sm text-[#7e8d87] mb-5">
        Your card details are processed securely by Stripe. We never store them.
      </p>

      <form id="payment-form" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#7e8d87] mb-1">Card Details</label>
          <div className="w-full px-4 py-3 border border-[#e4ebe8] rounded-xl focus-within:ring-2 focus-within:ring-[#0d4a38] focus-within:border-transparent transition">
            <CardElement
              id="card-element"
              options={{
                style: {
                  base: {
                    fontSize: '14px',
                    color: '#374151',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    '::placeholder': { color: '#9ca3af' },
                    iconColor: '#6b7280',
                  },
                  invalid: { color: '#ef4444', iconColor: '#ef4444' },
                },
                hidePostalCode: false,
              }}
            />
          </div>
        </div>

        {stripeError && (
          <p className="text-xs text-red-500 mt-1 mb-3" role="alert">{stripeError}</p>
        )}

        <button
          id="pay-now-btn"
          type="submit"
          disabled={!stripe || isBusy}
          className="w-full py-3 bg-[#0d4a38] hover:bg-[#083a2c] disabled:opacity-50 text-white font-semibold rounded-xl active:scale-95 transition-all"
        >
          {resolvePayButtonLabel(paymentPhase, total)}
        </button>

        {isBusy && (
          <div className="mt-4 rounded-xl border border-[#e4ebe8] bg-[#f5f7f6] px-4 py-3">
            <p className="text-sm font-semibold text-[#0d4a38]">{progressLabel}</p>
          </div>
        )}
      </form>
    </div>
  );
}

function resolvePayButtonLabel(paymentPhase, total) {
  switch (paymentPhase) {
    case 'confirming':
      return 'Authorizing payment...';
    case 'awaiting-webhook':
      return 'Waiting for payment confirmation...';
    case 'resolving':
      return 'Finalizing status...';
    default:
      return `Pay ${formatAmount(total)}`;
  }
}

function resolveProgressLabel(paymentPhase, paymentStatus) {
  if (paymentPhase === 'confirming') {
    return 'Processing payment...';
  }

  if (paymentPhase === 'awaiting-webhook') {
    if (paymentStatus === 'PAID') {
      return 'Payment confirmed. Redirecting...';
    }
    if (paymentStatus === 'FAILED') {
      return 'Payment failed. Redirecting...';
    }
    return 'Processing... could take up to 15 seconds';
  }

  if (paymentPhase === 'resolving') {
    return 'Finalizing your order...';
  }

  return 'Processing payment...';
}

function buildOrderSuccessPath(orderId, paymentStatus) {
  const params = new URLSearchParams({ orderId: String(orderId) });
  if (paymentStatus) {
    params.set('paymentStatus', paymentStatus);
  }
  return `/order-success?${params.toString()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Order summary panel (right sidebar — mirrors CartPage layout)
// ─────────────────────────────────────────────────────────────────────────────

function OrderSummaryPanel({ cart, orderTotal, orderDiscount, orderSnapshot, pointsToRedeem, orderItemsSnapshot, deliveryAddress, showAddress }) {
  const LKR_PER_POINT = 5;

  // Use orderTotal snapshot (set at order placement) so the total stays correct
  // after clearCart() zeroes cart.totalAmount in the payment step.
  // During address step: discount is not yet confirmed — compute from pointsToRedeem.
  // After order is placed: use the server-confirmed orderDiscount.
  const pendingDiscount   = (orderDiscount <= 0 && pointsToRedeem > 0)
    ? pointsToRedeem * LKR_PER_POINT
    : 0;
  const displayDiscount   = orderDiscount > 0 ? orderDiscount : pendingDiscount;
  const subtotalBeforeDiscount = orderTotal > 0 ? orderTotal + displayDiscount : cart.totalAmount;
  const displayTotal      = orderTotal > 0 ? orderTotal : Math.max(0, cart.totalAmount - displayDiscount); // rawTotal already reflects the confirmed discount post-placement

  // Use snapshot items if available (during payment step), else cart items
  const displayItems = (orderItemsSnapshot && orderItemsSnapshot.length > 0)
    ? orderItemsSnapshot
    : cart.items;

  return (
    <div className="lg:w-80 shrink-0">
      <div className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-6 lg:sticky lg:top-24 space-y-4">
        <h2 className="text-lg font-bold text-[#163a2f]">Order Summary</h2>

        <div className="space-y-2">
          {displayItems.map((item, idx) => (
            <div key={item.cartItemId || item.productId || idx} className="flex justify-between text-sm text-gray-600">
              <span className="truncate flex-1 mr-2 text-[#163a2f]">
                {item.productName}
                <span className="text-[#7e8d87]"> × {item.quantity}</span>
              </span>
              <span className="font-semibold text-[#0d4a38] whitespace-nowrap">
                {formatAmount(item.lineTotal)}
              </span>
            </div>
          ))}
        </div>

        {displayDiscount > 0 && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-[#7e8d87]">
              <span>Items subtotal</span>
              <span>{formatAmount(subtotalBeforeDiscount)}</span>
            </div>
            <div className="flex justify-between text-[#0d4a38] font-medium">
              <span>Loyalty discount ({orderDiscount > 0 ? (orderSnapshot?.pointsRedeemed ?? pointsToRedeem) : pointsToRedeem} pts)</span>
              <span>− {formatAmount(displayDiscount)}</span>
            </div>
          </div>
        )}

        <div className="border-t border-[#e4ebe8] pt-4 flex justify-between">
          <span className="font-bold text-[#163a2f]">Total</span>
          <span className="font-extrabold text-[#0d4a38] text-lg">{formatAmount(displayTotal)}</span>
        </div>

        {showAddress && deliveryAddress && (
          <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7e8d87] mb-1">
              Delivering to
            </p>
            <p className="text-sm text-[#163a2f]">{deliveryAddress}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step progress pill
// ─────────────────────────────────────────────────────────────────────────────

function StepPill({ num, label, active, done }) {
  const circleClass = done
    ? 'bg-[#0d4a38] text-white'
    : active
      ? 'bg-[#0d4a38] text-white'
      : 'bg-[#e4ebe8] text-[#7e8d87]';

  const labelClass = active || done ? 'text-[#0d4a38] font-semibold' : 'text-[#7e8d87]';

  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${circleClass}`}>
        {done ? '✓' : num}
      </div>
      <span className={`text-sm ${labelClass}`}>{label}</span>
    </div>
  );
}
