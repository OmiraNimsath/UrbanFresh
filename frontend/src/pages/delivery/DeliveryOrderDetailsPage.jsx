import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { getDeliveryOrderById } from '../../services/orderService';

function formatStatusLabel(status) {
  if (!status) {
    return 'Pending';
  }

  return status
    .toLowerCase()
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

/**
 * Presentation Layer – Mobile-first delivery order details screen.
 * Shows address, order items, and status for the assigned delivery person.
 */
export default function DeliveryOrderDetailsPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [isActionBusy, setIsActionBusy] = useState(false);

  const statusClassName = useMemo(() => {
    const status = order?.status || '';

    if (status === 'PENDING') {
      return 'bg-slate-100 text-slate-700 border-slate-200';
    }
    if (status === 'OUT_FOR_DELIVERY') {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    if (status === 'DELIVERED') {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
    if (status === 'READY') {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }

    return 'bg-gray-100 text-gray-700 border-gray-200';
  }, [order?.status]);

  const itemCount = useMemo(() => {
    if (!Array.isArray(order?.items)) {
      return 0;
    }

    return order.items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
  }, [order?.items]);

  const orderValue = useMemo(() => {
    if (!Array.isArray(order?.items)) {
      return 0;
    }

    return order.items.reduce(
      (sum, item) => sum + Number(item?.quantity || 0) * Number(item?.unitPrice || 0),
      0,
    );
  }, [order?.items]);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setErrorState(null);

    try {
      const response = await getDeliveryOrderById(orderId);
      setOrder(response);
    } catch (error) {
      const statusCode = error?.response?.status;

      if (statusCode === 403) {
        setErrorState('forbidden');
      } else if (statusCode === 404) {
        setErrorState('not-found');
      } else {
        setErrorState('failed');
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleBack = () => {
    navigate('/delivery');
  };

  const handleRefresh = async () => {
    setIsActionBusy(true);
    await loadOrder();
    setIsActionBusy(false);
    toast.success('Delivery details refreshed.');
  };

  const handleCopyAddress = async () => {
    if (!order?.deliveryAddress) {
      toast.error('Address is not available for this order.');
      return;
    }

    try {
      await navigator.clipboard.writeText(order.deliveryAddress);
      toast.success('Address copied to clipboard.');
    } catch {
      toast.error('Unable to copy address.');
    }
  };

  const handleOpenMap = () => {
    if (!order?.deliveryAddress) {
      toast.error('Address is not available for this order.');
      return;
    }

    const encodedAddress = encodeURIComponent(order.deliveryAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-28">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back
          </button>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery Order</p>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">#{orderId}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        )}

        {!loading && errorState === 'forbidden' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold">This order is not assigned to you.</h2>
            <p className="mt-1 text-sm">
              Access is restricted to the assigned delivery person only.
            </p>
            <button
              type="button"
              onClick={handleBack}
              className="mt-4 h-11 rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-700"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {!loading && errorState === 'not-found' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-700 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold">Order not found</h2>
            <p className="mt-1 text-sm">This order may have been removed or reassigned.</p>
          </div>
        )}

        {!loading && errorState === 'failed' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-gray-700 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold">Unable to load order details</h2>
            <p className="mt-1 text-sm">Please refresh and try again.</p>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isActionBusy}
              className="mt-4 h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !errorState && order && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Delivery Status</h2>
                  <p className="mt-1 text-sm text-slate-500">Track current progress for this assignment.</p>
                </div>
                <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${statusClassName}`}>
                  {formatStatusLabel(order.status)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Items</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{itemCount}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order Value</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">Rs. {orderValue.toFixed(2)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Customer Address</h2>
              <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800 sm:text-base">
                {order.deliveryAddress}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Copy Address
                </button>
                <button
                  type="button"
                  onClick={handleOpenMap}
                  className="h-11 rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Open in Maps
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Order Items</h2>
              <ul className="mt-3 space-y-3">
                {order.items?.map((item, index) => (
                  <li
                    key={`${item.productId ?? item.productName}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 sm:text-base">{item.productName}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                        Qty {item.quantity}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-600 sm:text-sm">
                      <p>Unit price: Rs. {Number(item.unitPrice).toFixed(2)}</p>
                      <p className="font-semibold text-slate-800">
                        Rs. {(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {(!order.items || order.items.length === 0) && (
                <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  No items available for this order.
                </p>
              )}
            </section>
          </>
        )}
      </main>

      {!loading && !errorState && order && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isActionBusy}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isActionBusy ? 'Refreshing...' : 'Refresh Details'}
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
