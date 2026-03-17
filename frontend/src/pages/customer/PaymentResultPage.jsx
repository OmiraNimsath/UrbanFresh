/**
 * Page Layer – Payment result feedback page.
 * Displayed after a Stripe payment attempt succeeds or fails.
 * Reads the outcome from ?status=success|failed&orderId=… URL params.
 *
 * Styling matches the site-wide green-50 / white-card / green-600 convention.
 * Bug fix: navigate() is NOT called inside a setState updater (which caused the
 * "Cannot update BrowserRouter while rendering" warning). Countdown decrement
 * and navigation are split into separate useEffect calls.
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const status  = searchParams.get('status');   // 'success' | 'failed'
  const orderId = searchParams.get('orderId');

  const [countdown, setCountdown] = useState(5);

  // Tick the countdown down once per second (success only)
  useEffect(() => {
    if (status !== 'success') return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1); // pure updater — no side effects
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Navigate when countdown reaches 0 — kept in its own effect so navigate()
  // is never called inside a setState updater, fixing the BrowserRouter warning.
  useEffect(() => {
    if (status === 'success' && countdown <= 0) {
      navigate('/dashboard');
    }
  }, [countdown, status, navigate]);

  const isSuccess = status === 'success';
  const isFailure = status === 'failed';

  // Guard: unknown status param
  if (!isSuccess && !isFailure) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Invalid payment result. Please go back.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">

          {/* ── Icon ── */}
          <div className={`mx-auto mb-5 flex items-center justify-center w-20 h-20 rounded-full ${
            isSuccess ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isSuccess ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="w-10 h-10 text-green-600" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="w-10 h-10 text-red-500" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            )}
          </div>

          {/* ── Heading ── */}
          <h1 id="payment-result-heading"
            className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-green-700' : 'text-red-600'}`}>
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </h1>

          {/* ── Message ── */}
          <p className="text-sm text-gray-500 mb-4">
            {isSuccess
              ? `Your order${orderId ? ` #${orderId}` : ''} has been confirmed and is being prepared.`
              : 'Your payment could not be processed. No charge was made.'}
          </p>

          {/* ── Countdown (success) ── */}
          {isSuccess && (
            <p className="text-xs text-gray-400 mb-6">
              Redirecting to your dashboard in <span className="font-semibold text-gray-600">{Math.max(countdown, 0)}</span> second{countdown !== 1 ? 's' : ''}…
            </p>
          )}

          {/* ── CTAs ── */}
          <div className={`flex gap-3 justify-center ${!isSuccess ? 'mt-2' : ''}`}>
            {isSuccess ? (
              <Link
                to="/dashboard"
                id="view-orders-btn"
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                View My Orders
              </Link>
            ) : (
              <>
                <Link
                  to="/cart"
                  id="retry-payment-btn"
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Back to Cart
                </Link>
                <Link
                  to="/dashboard"
                  id="go-dashboard-btn"
                  className="px-6 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                >
                  My Orders
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="bg-gray-800 text-gray-400 text-center py-6 text-sm mt-10">
        © {new Date().getFullYear()} UrbanFresh. Reducing food waste, one deal at a time.
      </footer>
    </div>
  );
}
