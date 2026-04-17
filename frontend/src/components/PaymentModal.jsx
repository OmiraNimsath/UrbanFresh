import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import {
  createPaymentIntent,
  waitForChargeUpdatedAndFetchLatest,
} from '../services/paymentService';
import { formatAmount } from '../utils/priceUtils';

/**
 * Modal component for retrying payment on a PENDING order.
 * Displays Stripe CardElement for secure card entry and submits payment.
 * On submit, waits for charge.updated acknowledgement and resolves latest status.
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
  const initializationRef = useRef(null);

  // Initialize Stripe and fetch clientSecret when modal opens
  // Use useRef to prevent StrictMode from creating duplicate payment intents
  useEffect(() => {
    if (!isOpen || !orderId) {
      initializationRef.current = null;
      return;
    }

    // If we've already initiated for this orderId, skip
    if (initializationRef.current === orderId) {
      return;
    }

    initializationRef.current = orderId;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-[#e4ebe8] bg-white p-6 shadow-2xl">
        <div>
          <h2 className="text-xl font-bold text-[#163a2f]">Retry Payment</h2>
          <p className="mt-1 text-sm text-[#6f817b]">Enter your card details to complete payment</p>
        </div>

        <div className="rounded-xl border border-[#e4ebe8] bg-[#f8fbf9] p-4">
          <p className="text-xs text-[#6f817b]">Order Total</p>
          <p className="mt-1 text-2xl font-bold text-[#0d4a38]">{formatAmount(totalAmount)}</p>
        </div>

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
            <p className="text-sm text-[#6f817b]">Loading payment form...</p>
          </div>
        )}

        <button
          onClick={onClose}
          disabled={loading}
          className="w-full rounded-lg border border-[#e4ebe8] py-2 text-sm font-semibold text-[#6f817b] transition-colors hover:bg-[#f8fbf9] hover:text-[#163a2f] disabled:opacity-50"
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
  const [paymentPhase, setPaymentPhase] = useState('idle');
  const [liveStatus, setLiveStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setPaymentPhase('confirming');
    setLiveStatus(null);

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        toast.error(result.error.message || 'Card declined. Please try another card.');
        setPaymentPhase('idle');
      } else {
        setPaymentPhase('awaiting-webhook');

        const { latestStatus, timedOut } = await waitForChargeUpdatedAndFetchLatest({
          orderId,
          timeoutMs: 15000,
          pollIntervalMs: 1500,
          onUpdate: setLiveStatus,
        });

        if (timedOut) {
          toast('Payment confirmation is taking longer than expected. Please try again.', {
            icon: '⏳',
          });
        }

        onSuccess?.({
          orderId,
          latestStatus,
          timedOut,
        });
        onClose();
      }
    } catch {
      toast.error('Payment failed. Please try again.');
      setPaymentPhase('idle');
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel = resolvePayButtonLabel(paymentPhase);
  const progressLabel = resolveProgressLabel(paymentPhase, liveStatus?.paymentStatus);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-lg border border-[#e4ebe8] p-3 focus-within:border-[#0d4a38] focus-within:ring-2 focus-within:ring-[#d9ebe3]">
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
        className="w-full rounded-lg bg-[#0d4a38] py-2.5 font-semibold text-white transition-colors hover:bg-[#083a2c] disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {loading ? buttonLabel : 'Pay Now'}
      </button>

      {loading && (
        <div className="rounded-lg border border-[#d6e8df] bg-[#eaf5ef] px-3 py-2">
          <p className="text-xs font-semibold text-[#0d4a38]">{progressLabel}</p>
        </div>
      )}
    </form>
  );
}

function resolvePayButtonLabel(paymentPhase) {
  switch (paymentPhase) {
    case 'confirming':
      return 'Authorizing payment...';
    case 'awaiting-webhook':
      return 'Waiting for charge update...';
    default:
      return 'Processing...';
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

  return 'Processing payment...';
}
