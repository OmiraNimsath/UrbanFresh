import { formatAmount } from '../../utils/priceUtils';

/**
 * Presentation Layer – Modal for reviewing complete admin order details.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-3 py-3 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#d9e6e0] bg-[#f5f7f6] shadow-[0_22px_50px_rgba(10,40,32,0.32)]">
        <header className="flex items-start justify-between border-b border-[#e3ebe7] bg-[#f5f7f6] px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#13392f] sm:text-2xl">Order Review</h2>
            <p className="mt-0.5 text-xs text-[#61756e] sm:text-sm">
              Manage and review lifecycle for order #{order?.orderId ?? 'UF-ORD-2041'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e9efec] text-[#526b64] transition hover:bg-white"
            aria-label="Close order review"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-5">
          {loading && (
            <div className="space-y-3">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="h-10 animate-pulse rounded-xl bg-[#e4ebe8]" />
              ))}
            </div>
          )}

          {!loading && !order && (
            <div className="rounded-xl border border-[#f3c8c8] bg-[#fdecee] px-4 py-3 text-sm text-[#b03a3a]">
              Unable to load this order right now.
            </div>
          )}

          {!loading && order && (
            <div className="space-y-5">
              <section>
                <SectionTitle title="Order Information" />
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoTile label="Order ID" value={`#UF-ORD-${order.orderId}`} />
                  <InfoTile label="Status" value={order.orderStatus} />
                  <InfoTile label="Payment Status" value={order.paymentStatus} />
                  <InfoTile label="Delivery Person" value={resolvedDeliveryPersonName || 'Not assigned'} />
                  <InfoTile label="Order Date" value={formatDateTime(order.orderDate)} />
                  <InfoTile label="Last Updated" value={formatDateTime(order.lastUpdatedDate)} />
                </div>
              </section>

              <section>
                <SectionTitle title="Customer Information" />
                <div className="rounded-3xl border border-[#e4ebe8] bg-white p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Field label="Name" value={order.customer?.customerName} />
                      <Field label="Email" value={order.customer?.email} />
                      <Field label="Contact" value={order.customer?.phone} />
                    </div>
                    <div className="space-y-3">
                      <Field label="Shipping Address" value={order.customer?.shippingAddress} />
                      <Field label="Billing Address" value={order.customer?.billingAddress} />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <SectionTitle title="Order Items" />
                <div className="overflow-hidden rounded-3xl border border-[#e4ebe8] bg-white">
                  <div className="hidden grid-cols-[minmax(220px,1fr)_100px_120px_130px] border-b border-[#edf2f0] bg-[#f8fbf9] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#73847f] sm:grid">
                    <p>Product</p>
                    <p>Quantity</p>
                    <p>Price</p>
                    <p>Subtotal</p>
                  </div>

                  {orderItems.length === 0 ? (
                    <p className="px-4 py-8 text-sm text-[#6f817b]">No order items found.</p>
                  ) : (
                    orderItems.map((item, index) => (
                      <article key={`${item.productId ?? 'na'}-${index}`} className="border-t border-[#edf2f0] px-4 py-3 first:border-t-0 sm:grid sm:grid-cols-[minmax(220px,1fr)_100px_120px_130px] sm:items-center sm:gap-2.5">
                        <div className="flex items-center gap-2.5">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName ?? 'Order item image'}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#edf2f0] text-xs text-[#6f817b]">No image</div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-[#17392f] sm:text-base">{item.productName ?? '—'}</p>
                            <p className="text-xs text-[#73847f]">Category details not available</p>
                          </div>
                        </div>
                        <p className="mt-2 inline-flex w-max rounded-lg bg-[#e8efec] px-2 py-0.5 text-xs font-semibold text-[#17392f] sm:mt-0">x{item.quantity ?? '—'}</p>
                        <p className="mt-2 text-sm font-semibold text-[#17392f] sm:mt-0">{formatAmount(item.unitPrice ?? 0)}</p>
                        <p className="mt-2 text-base font-bold text-[#0d4a38] sm:mt-0">{formatAmount(item.subtotal ?? 0)}</p>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl bg-[linear-gradient(150deg,#063a2e,#0d4a38)] p-4 text-white shadow-[0_20px_35px_rgba(7,45,35,0.35)]">
                  <h3 className="text-xl font-semibold">Pricing Summary</h3>
                  <div className="mt-4 space-y-2.5 text-sm text-[#d2ece2]">
                    <SummaryRow label="Subtotal" value={formatAmount(order.pricing?.subtotal ?? 0)} />
                    <SummaryRow label="Discounts" value={formatAmount(order.pricing?.discounts ?? 0)} />
                    <SummaryRow label="Taxes" value={formatAmount(order.pricing?.taxes ?? 0)} />
                    <SummaryRow label="Shipping" value={formatAmount(order.pricing?.shippingCost ?? 0)} />
                  </div>
                  <div className="mt-3 border-t border-white/25 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#bfe4d4]">Final Total</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">{formatAmount(order.pricing?.finalTotal ?? 0)}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#e4ebe8] bg-[#edf2f0] p-4">
                  <h3 className="text-xl font-semibold text-[#17392f]">Payment Details</h3>
                  <div className="mt-4 space-y-4">
                    <KeyValue label="Method" value={order.payment?.paymentMethod} />
                    <KeyValue label="Status" value={order.payment?.paymentStatus} />
                    <KeyValue label="Transaction Ref" value={order.payment?.transactionReference} />
                  </div>
                </div>
              </section>

              <section>
                <SectionTitle title="Status History" />
                <div className="overflow-hidden rounded-3xl border border-[#e4ebe8] bg-white">
                  {statusHistory.length === 0 ? (
                    <p className="px-4 py-8 text-sm text-[#6f817b]">No status history is available for this order yet.</p>
                  ) : (
                    <>
                      <div className="hidden grid-cols-[160px_1fr_1fr_1fr_1fr] border-b border-[#edf2f0] bg-[#f8fbf9] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#73847f] md:grid">
                        <p>Changed At</p>
                        <p>From</p>
                        <p>To</p>
                        <p>Changed By</p>
                        <p>Correction Reason</p>
                      </div>
                      {statusHistory.map((entry, index) => (
                        <article
                          key={`${entry.changedAt ?? 'na'}-${entry.previousStatus ?? 'na'}-${entry.newStatus ?? 'na'}-${index}`}
                          className="grid gap-2 border-t border-[#edf2f0] px-4 py-3 text-sm text-[#425d55] first:border-t-0 md:grid-cols-[160px_1fr_1fr_1fr_1fr]"
                        >
                          <p>{formatDateTime(entry.changedAt)}</p>
                          <p>{entry.previousStatus ?? '—'}</p>
                          <p className="font-semibold text-[#17392f]">{entry.newStatus ?? '—'}</p>
                          <p>{entry.changedBy ?? '—'}</p>
                          <p>{entry.changeReason ?? '—'}</p>
                        </article>
                      ))}
                    </>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>

        <footer className="flex flex-col justify-end gap-2.5 border-t border-[#e3ebe7] bg-white px-4 py-3 sm:flex-row sm:px-5">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[#0d4a38] bg-white px-4 text-sm font-semibold text-[#0d4a38] transition hover:bg-[#f1f7f4]"
          >
            Download Invoice
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0d4a38] px-4 text-sm font-semibold text-white transition hover:bg-[#083a2c]"
          >
            Mark as Out for Delivery
          </button>
        </footer>
      </div>
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <h3 className="mb-2.5 flex items-center gap-2 text-lg font-semibold text-[#14392f] sm:text-xl">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e3efe9] text-[#2f7f5f]">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
      </span>
      {title}
    </h3>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#e4ebe8] bg-white p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#73847f]">{label}</p>
      <p className="mt-1 text-base font-semibold text-[#17392f] sm:text-lg">{value || '—'}</p>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#73847f]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#17392f] sm:text-base">{value || '—'}</p>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function KeyValue({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#72857f]">{label}</p>
      <p className="mt-1 text-base font-semibold text-[#14392f]">{value || '—'}</p>
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
