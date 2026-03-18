import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { createPaymentIntent } from '../services/paymentService';
import { formatAmount } from '../utils/priceUtils';

/**
 * Modal component for retrying payment on a PENDING order.
 * Displays Stripe CardElement for secure card entry and submits payment.
 * On success, redirects to payment result page; on failure, shows error.
 * 
 * @param {number}   orderId    - Order ID to retry payment for
 * @param {number}   totalAmount - Order total in LKR (for display only)
 * @param {boolean}  isOpen     - Whether modal is visible
 * @param {function} onClose    - Callback when user closes modal
 * @param {function} onSuccess  - Callback after successful payment
 */
export default function PaymentModal({ orderId, totalAmount, isOpen, onClose, onSuccess }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize Stripe and fetch clientSecret when modal opens
  useEffect(() => {
    if (!isOpen || !orderId) return;

    const initializePayment = async () => {
      try {
        const { clientSecret: secret, publishableKey } = await createPaymentIntent(orderId);
        setStripePromise(loadStripe(publishableKey));
        setClientSecret(secret);
      } catch (err) {
        const msg = err?.response?.data?.message || 'Failed to initialize payment. Please try again.';
        toast.error(msg);
        onClose();
      }
    };

    initializePayment();
  }, [isOpen, orderId, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 backdrop-blur-md bg-transparent flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Retry Payment</h2>
          <p className="text-sm text-gray-500 mt-1">Enter your card details to complete payment</p>
        </div>

        {/* Order total display */}
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-gray-500">Order Total</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatAmount(totalAmount)}</p>
        </div>

        {/* Stripe payment form */}
        {stripePromise && clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentFormContent
              orderId={orderId}
              clientSecret={clientSecret}
              loading={loading}
              setLoading={setLoading}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-500">Loading payment form…</p>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="w-full text-sm text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}

/**
 * Nested component: Card form and submission logic.
 * Calls stripe.confirmCardPayment when submitted.
 */
function PaymentFormContent({
  orderId,
  clientSecret,
  loading,
  setLoading,
  onSuccess,
  onClose,
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        toast.error(result.error.message || 'Card declined. Please try another card.');
      } else if (result.paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess?.(orderId);
        onClose();
      }
    } catch (err) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="border border-gray-200 rounded-lg p-3 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '14px',
                color: '#333',
                '::placeholder': { color: '#ccc' },
              },
            },
          }}
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:cursor-not-allowed"
      >
        {loading ? 'Processing…' : 'Pay Now'}
      </button>
    </form>
  );
}
