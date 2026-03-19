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
import { useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';

import Navbar from '../../components/Navbar';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { placeOrder } from '../../services/orderService';
import { createPaymentIntent } from '../../services/paymentService';
import { formatAmount } from '../../utils/priceUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Page root
// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { cart, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [addressError, setAddressError] = useState('');

  const [orderId, setOrderId]             = useState(null);
  const [orderTotal, setOrderTotal]       = useState(0);   // snapshot before cart is cleared
  const [orderItemsSnapshot, setOrderItemsSnapshot] = useState([]); // snapshot of items
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

      // Place order first
      const order = await placeOrder(deliveryAddress.trim(), orderItems);

      // Create PaymentIntent with the new orderId
      const { clientSecret: secret, publishableKey } = await createPaymentIntent(order.orderId);

      // Commit all state before clearing cart.
      // Snapshot totalAmount NOW — cart.totalAmount becomes 0 after clearCart().
      setStripePromise(loadStripe(publishableKey));
      setClientSecret(secret);
      setOrderId(order.orderId);
      setOrderTotal(order.totalAmount);   // ← captured from order, not cart
      setOrderItemsSnapshot(order.items); // ← capture items from order response
      setStep('payment');

      // Cart cleared after step flip (stock already reserved)
      await clearCart();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-green-700">Checkout</h1>
          <Link to="/cart" className="text-sm text-green-600 hover:underline">
            ← Back to Cart
          </Link>
        </div>

        {/* ── Step progress ── */}
        <div className="flex items-center gap-2 mb-8">
          <StepPill num={1} label="Delivery Address" active={step === 'address'} done={step === 'payment'} />
          <div className={`flex-1 h-0.5 rounded ${step === 'payment' ? 'bg-green-500' : 'bg-gray-200'}`} />
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
                />
              </Elements>
            )}
          </div>

          {/* ── Right: order summary ── */}
          <OrderSummaryPanel
            cart={cart}
            orderTotal={orderTotal}
            orderItemsSnapshot={orderItemsSnapshot} // ← new prop
            deliveryAddress={deliveryAddress}
            showAddress={step === 'payment'}
          />
        </div>
      </div>


      <footer className="bg-gray-800 text-gray-400 text-center py-6 text-sm mt-10">
        © {new Date().getFullYear()} UrbanFresh. Reducing food waste, one deal at a time.
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 – Address form
// ─────────────────────────────────────────────────────────────────────────────

function AddressStep({ deliveryAddress, setDeliveryAddress, addressError, loading, onProceed, cart }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Delivery Address</h2>
      <p className="text-sm text-gray-500 mb-5">
        Confirm where your order should be delivered.
      </p>

      <div className="mb-5">
        <label htmlFor="delivery-address" className="block text-sm font-medium text-gray-700 mb-1">
          Address <span className="text-red-500">*</span>
        </label>
        <textarea
          id="delivery-address"
          rows={3}
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          disabled={loading}
          placeholder="e.g. 42, Galle Road, Colombo 03"
          className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition resize-none ${
            addressError ? 'border-red-400' : 'border-gray-300'
          }`}
        />
        {addressError && (
          <p className="text-xs text-red-500 mt-1">{addressError}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Pre-filled from your profile — edit if delivering elsewhere.
        </p>
      </div>

      <button
        id="proceed-to-payment-btn"
        onClick={onProceed}
        disabled={loading || cart.items.length === 0}
        className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold rounded-xl active:scale-95 transition-all"
      >
        {loading ? 'Placing order…' : 'Place Order & Pay'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 – Stripe payment form (must be inside <Elements>)
// ─────────────────────────────────────────────────────────────────────────────

function PaymentStep({ orderId, total, clientSecret }) {
  const stripe   = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [paying, setPaying]           = useState(false);
  const [stripeError, setStripeError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setStripeError(null);

    const cardElement = elements.getElement(CardElement);

    const { error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      setStripeError(error.message);
      setPaying(false);
    } else {
      navigate(`/payment/result?status=success&orderId=${orderId}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Secure Payment</h2>
      <p className="text-sm text-gray-500 mb-5">
        Your card details are processed securely by Stripe. We never store them.
      </p>

      <form id="payment-form" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Card Details</label>
          <div className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-green-400 focus-within:border-transparent transition">
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
          disabled={!stripe || paying}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold rounded-xl active:scale-95 transition-all"
        >
          {paying ? 'Processing…' : `Pay ${formatAmount(total)}`}
        </button>
      </form>

      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        <p className="text-xs text-green-700 font-medium mb-0.5">🧪 Sandbox test card</p>
        <p className="text-xs text-green-600">
          <strong>4242 4242 4242 4242</strong> · Any future date · Any CVC · Any ZIP
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Order summary panel (right sidebar — mirrors CartPage layout)
// ─────────────────────────────────────────────────────────────────────────────

function OrderSummaryPanel({ cart, orderTotal, orderItemsSnapshot, deliveryAddress, showAddress }) {
  // Use orderTotal snapshot (set at order placement) so the total stays correct
  // after clearCart() zeroes cart.totalAmount in the payment step.
  const displayTotal = orderTotal > 0 ? orderTotal : cart.totalAmount;

  // Use snapshot items if available (during payment step), else cart items
  const displayItems = (orderItemsSnapshot && orderItemsSnapshot.length > 0)
    ? orderItemsSnapshot
    : cart.items;

  return (
    <div className="lg:w-80 flex-shrink-0">
      <div className="bg-white rounded-2xl shadow-sm p-6 lg:sticky lg:top-24 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Order Summary</h2>

        <div className="space-y-2">
          {displayItems.map((item, idx) => (
            <div key={item.cartItemId || item.productId || idx} className="flex justify-between text-sm text-gray-600">
              <span className="truncate flex-1 mr-2">
                {item.productName}
                <span className="text-gray-400"> × {item.quantity}</span>
              </span>
              <span className="font-medium text-gray-800 whitespace-nowrap">
                {formatAmount(item.lineTotal)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-gray-800">
          <span>Total</span>
          <span className="text-green-700">{formatAmount(displayTotal)}</span>
        </div>

        {showAddress && deliveryAddress && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Delivering to
            </p>
            <p className="text-sm text-gray-600">{deliveryAddress}</p>
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
    ? 'bg-green-600 text-white'
    : active
      ? 'bg-green-600 text-white'
      : 'bg-gray-200 text-gray-500';

  const labelClass = active || done ? 'text-green-700 font-semibold' : 'text-gray-400';

  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${circleClass}`}>
        {done ? '✓' : num}
      </div>
      <span className={`text-sm ${labelClass}`}>{label}</span>
    </div>
  );
}
