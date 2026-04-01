import { formatAmount } from '../../utils/priceUtils';

/**
 * Presentation Layer – Modal for reviewing complete admin order details.
 * Displays order metadata, customer info, item rows, pricing, payment, and status history.
 */
export default function OrderReviewModal({
  isOpen,
  loading,
  order,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  const orderItems = order?.items ?? [];
  const statusHistory = order?.statusHistory ?? [];
  const resolvedDeliveryPersonName = order?.deliveryPersonName ?? order?.deliveryPerson?.name ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Order Review</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(90vh-73px)] overflow-y-auto px-6 py-5">
          {loading && (
            <div className="space-y-3">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="h-10 animate-pulse rounded-lg bg-gray-200" />
              ))}
            </div>
          )}

          {!loading && !order && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Unable to load this order right now.
            </div>
          )}

          {!loading && order && (
            <div className="space-y-6">
              <section className="rounded-xl border border-gray-200 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Order Information</h3>
                <div className="grid gap-3 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Order ID" value={`#${order.orderId}`} />
                  <Field label="Order Status" value={order.orderStatus} />
                  <Field label="Payment Status" value={order.paymentStatus} />
                  <Field label="Delivery Person" value={resolvedDeliveryPersonName || 'Not assigned'} />
                  <Field label="Order Date" value={formatDateTime(order.orderDate)} />
                  <Field label="Last Updated" value={formatDateTime(order.lastUpdatedDate)} />
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Customer Information</h3>
                <div className="grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
                  <Field label="Customer Name" value={order.customer?.customerName} />
                  <Field label="Email" value={order.customer?.email} />
                  <Field label="Contact" value={order.customer?.phone} />
                  <Field label="Shipping Address" value={order.customer?.shippingAddress} />
                  <Field label="Billing Address" value={order.customer?.billingAddress} />
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className={th}>Product</th>
                        <th className={th}>Image</th>
                        <th className={th}>Quantity</th>
                        <th className={th}>Price</th>
                        <th className={th}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                            No order items found.
                          </td>
                        </tr>
                      ) : (
                        orderItems.map((item, index) => (
                          <tr key={`${item.productId ?? 'na'}-${index}`} className="border-b border-gray-100">
                            <td className={td}>{item.productName ?? '—'}</td>
                            <td className={td}>
                              {item.productImage ? (
                                <img
                                  src={item.productImage}
                                  alt={item.productName ?? 'Order item image'}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              ) : (
                                <span className="text-xs text-gray-400">No image</span>
                              )}
                            </td>
                            <td className={td}>{item.quantity ?? '—'}</td>
                            <td className={td}>{formatAmount(item.unitPrice ?? 0)}</td>
                            <td className={td}>{formatAmount(item.subtotal ?? 0)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Pricing Summary</h3>
                  <SummaryRow label="Subtotal" value={formatAmount(order.pricing?.subtotal ?? 0)} />
                  <SummaryRow label="Discounts" value={formatAmount(order.pricing?.discounts ?? 0)} />
                  <SummaryRow label="Taxes" value={formatAmount(order.pricing?.taxes ?? 0)} />
                  <SummaryRow label="Shipping" value={formatAmount(order.pricing?.shippingCost ?? 0)} />
                  <SummaryRow
                    label="Final Total"
                    value={formatAmount(order.pricing?.finalTotal ?? 0)}
                    strong
                  />
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Payment Information</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <Field label="Payment Method" value={order.payment?.paymentMethod} inline />
                    <Field label="Payment Status" value={order.payment?.paymentStatus} inline />
                    <Field
                      label="Transaction Reference"
                      value={order.payment?.transactionReference}
                      inline
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Status History</h3>
                {statusHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">No status history is available for this order yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className={th}>Changed At</th>
                          <th className={th}>From</th>
                          <th className={th}>To</th>
                          <th className={th}>Changed By</th>
                          <th className={th}>Correction Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statusHistory.map((entry, index) => (
                          <tr
                            key={`${entry.changedAt ?? 'na'}-${entry.previousStatus ?? 'na'}-${entry.newStatus ?? 'na'}-${index}`}
                            className="border-b border-gray-100"
                          >
                            <td className={td}>{formatDateTime(entry.changedAt)}</td>
                            <td className={td}>{entry.previousStatus ?? '—'}</td>
                            <td className={td}>{entry.newStatus ?? '—'}</td>
                            <td className={td}>{entry.changedBy ?? '—'}</td>
                            <td className={td}>{entry.changeReason ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, inline = false }) {
  const displayValue = value === null || value === undefined || value === '' ? '—' : value;

  return (
    <div className={inline ? 'flex items-start justify-between gap-3' : ''}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm text-gray-800">{displayValue}</p>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={strong ? 'font-semibold text-gray-900' : 'text-gray-800'}>{value}</span>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const th = 'px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500';
const td = 'px-4 py-2 text-gray-700';
