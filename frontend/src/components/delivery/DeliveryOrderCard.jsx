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
      className="w-full rounded-3xl border border-[#e4ebe8] bg-white p-4 text-left shadow-sm transition hover:border-[#d5e2dc] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#9dd8bc] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.08em] text-[#709188]">Order #{delivery.orderId}</p>
          <p className="mt-1 text-xl font-semibold text-[#1f2726]">{customerName}</p>
          <p className="text-sm text-[#63716d]">{customerPhone}</p>
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

      <p className="mt-3 text-base text-[#3f4c48]">{address}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl border border-[#e2e9e5] bg-[#f8fbf9] px-3 py-2">
          <p className="text-xs font-medium tracking-[0.08em] text-[#71827d]">Items</p>
          <p className="mt-0.5 font-semibold text-[#334240]">
            {delivery.itemsSummary || `${delivery.itemCount || 0} item(s)`}
          </p>
        </div>
        <div className="rounded-xl border border-[#e2e9e5] bg-[#f8fbf9] px-3 py-2">
          <p className="text-xs font-medium tracking-[0.08em] text-[#71827d]">Total</p>
          <p className="mt-0.5 font-semibold text-[#334240]">{formatAmount(delivery.totalAmount || 0)}</p>
        </div>
        <div className="rounded-xl border border-[#e2e9e5] bg-[#f8fbf9] px-3 py-2">
          <p className="text-xs font-medium tracking-[0.08em] text-[#71827d]">Payment</p>
          <p className="mt-0.5 font-semibold text-[#334240]">{paymentMethod}</p>
        </div>
        <div className="rounded-xl border border-[#e2e9e5] bg-[#f8fbf9] px-3 py-2">
          <p className="text-xs font-medium tracking-[0.08em] text-[#71827d]">Pay Status</p>
          <p className="mt-0.5 font-semibold text-[#334240]">{paymentStatus}</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-[#e2e9e5] bg-[#f8fbf9] px-3 py-2 text-xs text-[#5b6f68]">
        {showHistoryMeta ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-[#4a5f58]">Final Status: {getDeliveryStatusLabel(delivery.status)}</span>
            <span>
              Completed At: {formatDateTime(delivery.finalStatusAt || delivery.createdAt)}
            </span>
          </div>
        ) : (
          <span>Assigned At: {formatDateTime(delivery.createdAt)}</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-end">
        <span className="text-base font-semibold text-[#1a6a4e]">View Details</span>
      </div>
    </button>
  );
}
