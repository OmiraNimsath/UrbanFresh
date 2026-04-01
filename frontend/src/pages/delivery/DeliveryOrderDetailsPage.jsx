import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import DeliveryInfoTile from '../../components/delivery/DeliveryInfoTile';
import DeliveryStatusConfirmModal from '../../components/admin/delivery/DeliveryStatusConfirmModal';
import {
  getDeliveryStatusBadgeClass,
  getDeliveryStatusLabel,
} from '../../components/admin/delivery/deliveryStatusUtils';
import {
  getDeliveryOrderById,
  updateAssignedDeliveryOrderStatus,
} from '../../services/orderService';
import { formatAmount } from '../../utils/priceUtils';

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
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);

  const statusClassName = useMemo(() => {
    return getDeliveryStatusBadgeClass(order?.status);
  }, [order?.status]);

  const canUpdateStatus = order?.status === 'OUT_FOR_DELIVERY';

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

  useEffect(() => {
    if (errorState === 'forbidden') {
      navigate('/unauthorized', { replace: true });
    }
  }, [errorState, navigate]);

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

  const requestStatusUpdate = (nextStatus) => {
    setPendingStatusUpdate(nextStatus);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!pendingStatusUpdate) {
      return;
    }

    setIsActionBusy(true);
    try {
      const updated = await updateAssignedDeliveryOrderStatus(orderId, pendingStatusUpdate);
      setOrder(updated);
      toast.success(`Order marked as ${getDeliveryStatusLabel(updated.status)}.`);
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to update delivery status.';
      toast.error(message);
    } finally {
      setIsActionBusy(false);
      setPendingStatusUpdate(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-28">
      <DeliveryStatusConfirmModal
        isOpen={Boolean(pendingStatusUpdate)}
        title={pendingStatusUpdate === 'RETURNED' ? 'Confirm Return' : 'Confirm Delivery'}
        message={
          pendingStatusUpdate === 'RETURNED'
            ? 'Are you sure you want to mark this order as returned?'
            : 'Are you sure you have successfully delivered this order?'
        }
        confirmLabel={pendingStatusUpdate === 'RETURNED' ? 'Mark Returned' : 'Mark Delivered'}
        intent={pendingStatusUpdate === 'RETURNED' ? 'danger' : 'success'}
        loading={isActionBusy}
        onCancel={() => setPendingStatusUpdate(null)}
        onConfirm={handleConfirmStatusUpdate}
      />

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
                  {getDeliveryStatusLabel(order.status)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <DeliveryInfoTile label="Items" value={itemCount} />
                <DeliveryInfoTile label="Total" value={formatAmount(order.totalAmount ?? orderValue)} />
                <DeliveryInfoTile label="Payment" value={order.paymentMethod || 'ONLINE (STRIPE)'} />
                <DeliveryInfoTile label="Pay Status" value={order.paymentStatus || 'PENDING'} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Customer Details</h2>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <DeliveryInfoTile label="Customer" value={order.customerName || 'Customer'} />
                <DeliveryInfoTile label="Phone" value={order.customerPhone || 'Not available'} />
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
          <div className="mx-auto w-full max-w-3xl space-y-2">
            {canUpdateStatus && (
              <div className="grid grid-cols-2 gap-2 sm:col-span-3">
                <button
                  type="button"
                  disabled={isActionBusy}
                  onClick={() => requestStatusUpdate('DELIVERED')}
                  className="h-11 rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Mark Delivered
                </button>
                <button
                  type="button"
                  disabled={isActionBusy}
                  onClick={() => requestStatusUpdate('RETURNED')}
                  className="h-11 rounded-xl border border-red-300 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Mark Returned
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isActionBusy}
                className="h-11 min-w-40 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isActionBusy ? 'Refreshing...' : 'Refresh Details'}
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="h-11 min-w-40 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
