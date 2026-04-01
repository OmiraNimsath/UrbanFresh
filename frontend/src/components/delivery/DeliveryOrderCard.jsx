import { formatAmount } from '../../utils/priceUtils';
import {
  getDeliveryStatusBadgeClass,
  getDeliveryStatusLabel,
} from '../admin/delivery/deliveryStatusUtils';

function formatDateTime(value) {
  if (!value) {
    return 'Not available';
  }

  return new Date(value).toLocaleString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Delivery order card used in the delivery dashboard list.
 */
export default function DeliveryOrderCard({
  delivery,
  onOpen,
  showNewlyAssigned = false,
  showHistoryMeta = false,
}) {
  const customerName = delivery?.customerName || 'Customer';
  const customerPhone = delivery?.customerPhone || 'Not available';
  const address = delivery?.shortDeliveryAddress || delivery?.fullDeliveryAddress || 'Address not available';
  const paymentMethod = delivery?.paymentMethod || 'ONLINE (STRIPE)';
  const paymentStatus = delivery?.paymentStatus || 'PENDING';

  return (
    <button
      type="button"
      onClick={() => onOpen(delivery.orderId)}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Order #{delivery.orderId}</p>
          <p className="mt-1 text-sm text-slate-700">{customerName}</p>
          <p className="text-xs text-slate-500">{customerPhone}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getDeliveryStatusBadgeClass(delivery.status)}`}
        >
          {getDeliveryStatusLabel(delivery.status)}
        </span>
      </div>

      {showNewlyAssigned ? (
        <div className="mt-2">
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Newly Assigned
          </span>
        </div>
      ) : null}

      <p className="mt-3 text-sm text-slate-700">{address}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:text-sm">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="font-medium text-slate-500">Items</p>
          <p className="mt-0.5 font-semibold text-slate-800">
            {delivery.itemsSummary || `${delivery.itemCount || 0} item(s)`}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="font-medium text-slate-500">Total</p>
          <p className="mt-0.5 font-semibold text-slate-800">{formatAmount(delivery.totalAmount || 0)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="font-medium text-slate-500">Payment</p>
          <p className="mt-0.5 font-semibold text-slate-800">{paymentMethod}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="font-medium text-slate-500">Pay Status</p>
          <p className="mt-0.5 font-semibold text-slate-800">{paymentStatus}</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        {showHistoryMeta ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-slate-700">Final Status: {getDeliveryStatusLabel(delivery.status)}</span>
            <span>
              Completed At: {formatDateTime(delivery.finalStatusAt || delivery.createdAt)}
            </span>
          </div>
        ) : (
          <span>Assigned At: {formatDateTime(delivery.createdAt)}</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-end">
        <span className="text-sm font-semibold text-emerald-700">View Details</span>
      </div>
    </button>
  );
}
