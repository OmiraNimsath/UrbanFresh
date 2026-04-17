import { Fragment, useState } from 'react';
import { formatAmount } from '../../utils/priceUtils';

export default function CustomerOrderCard({ order, onRetryPayment, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const paymentStatus = normalizePaymentStatus(order?.paymentStatus);
  const canRetryPayment =
    (paymentStatus === 'PENDING' || paymentStatus === 'FAILED') && Boolean(onRetryPayment);

  return (
    <article className="rounded-2xl border border-[#e4ebe8] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1d3a2f]">UF-{order.orderId}</p>
          <p className="mt-0.5 text-xs text-[#7c8b85]">{formatDate(order.createdAt)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[#1d3a2f]">{formatAmount(order.totalAmount)}</span>
          <PaymentBadge paymentStatus={paymentStatus} />
          <OrderBadge status={order.status} />

          {canRetryPayment && (
            <button
              onClick={() => onRetryPayment(order)}
              aria-label="Retry payment"
              title="Retry payment"
              className="rounded-lg border border-[#dbe4df] px-2 py-1 text-xs font-medium text-[#2f6550] transition-colors hover:bg-[#eef5f1]"
            >
              Retry Payment
            </button>
          )}

          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="rounded-lg border border-[#dbe4df] px-2 py-1 text-xs font-medium text-[#2f6550] transition-colors hover:bg-[#eef5f1]"
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-[#edf2ef] pt-3">
          <p className="text-xs text-[#6f817b]">Delivery: {order.deliveryAddress}</p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-140 text-left text-xs text-[#5d7169]">
              <thead>
                <tr className="border-b border-[#edf2ef] text-[#8b9993]">
                  <th className="py-2 font-medium">Product</th>
                  <th className="py-2 text-right font-medium">Qty</th>
                  <th className="py-2 text-right font-medium">Unit</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => {
                  const effectiveUnitPrice =
                    item.quantity > 0
                      ? Number(item.lineTotal) / item.quantity
                      : Number(item.unitPrice);
                  const hasProductDiscount = item.productDiscountPercentage > 0;

                  return (
                    <Fragment key={`${order.orderId}-${idx}`}>
                      <tr className="border-b border-[#f3f6f4]">
                        <td className="py-2">
                          {item.productName}{' '}
                          {hasProductDiscount && (
                            <span className="font-medium text-[#2f7a58]">
                              ({item.productDiscountPercentage}% OFF)
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">
                          {hasProductDiscount ? (
                            <span>
                              <span className="mr-1 text-[#9ba7a2] line-through">
                                {formatAmount(item.unitPrice)}
                              </span>
                              <span className="text-[#2f7a58]">{formatAmount(effectiveUnitPrice)}</span>
                            </span>
                          ) : (
                            formatAmount(item.unitPrice)
                          )}
                        </td>
                        <td className="py-2 text-right">{formatAmount(item.lineTotal)}</td>
                      </tr>

                      {item.batchAllocations?.length > 0 && (
                        <tr className="border-b border-[#f3f6f4] bg-[#f8fbf9]">
                          <td colSpan={4} className="px-2 py-2">
                            <div className="flex flex-wrap gap-2">
                              {item.batchAllocations.map((alloc, ai) => (
                                <span
                                  key={`${order.orderId}-${idx}-${ai}`}
                                  className="rounded bg-white px-2 py-0.5 text-[11px] text-[#6f817b]"
                                >
                                  {alloc.batchNumber}
                                  {alloc.expiryDate ? ` • exp ${alloc.expiryDate}` : ''}
                                  {` • qty ${alloc.allocatedQuantity}`}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {Number(order.discountAmount) > 0 && (
            <div className="space-y-1 border-t border-[#edf2ef] pt-2 text-xs">
              <div className="flex justify-between text-[#6f817b]">
                <span>Items subtotal</span>
                <span>{formatAmount(Number(order.totalAmount) + Number(order.discountAmount))}</span>
              </div>
              <div className="flex justify-between font-medium text-[#2f7a58]">
                <span>Loyalty discount ({order.pointsRedeemed} pts)</span>
                <span>- {formatAmount(order.discountAmount)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function OrderBadge({ status }) {
  const styles = {
    PENDING: 'bg-[#fff3dd] text-[#9a6b12]',
    PROCESSING: 'bg-[#e9f0ff] text-[#3454a1]',
    READY: 'bg-[#e7f5ed] text-[#2f7a58]',
    OUT_FOR_DELIVERY: 'bg-[#ecebff] text-[#5246a4]',
    DELIVERED: 'bg-[#e7f5ed] text-[#2f7a58]',
    RETURNED: 'bg-[#fff0e7] text-[#a45b2f]',
    CANCELLED: 'bg-[#fdecee] text-[#b63a3a]',
    CONFIRMED: 'bg-[#e7f5ed] text-[#2f7a58]',
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[status] ?? 'bg-[#f0f3f1] text-[#667974]'}`}>
      {status}
    </span>
  );
}

function PaymentBadge({ paymentStatus }) {
  const styles = {
    PAID: 'bg-[#e7f5ed] text-[#2f7a58]',
    FAILED: 'bg-[#fdecee] text-[#b63a3a]',
    PENDING: 'bg-[#fdecee] text-[#b63a3a]',
  };

  const normalized = paymentStatus || 'FAILED';

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[normalized] ?? 'bg-[#f0f3f1] text-[#667974]'}`}>
      {normalized === 'PENDING' ? 'FAILED' : normalized}
    </span>
  );
}

function normalizePaymentStatus(rawStatus) {
  if (rawStatus === null || rawStatus === undefined) return null;
  return String(rawStatus).trim().toUpperCase();
}

function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
