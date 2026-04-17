import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import AdminDeliveryLayout from '../../components/admin/delivery/AdminDeliveryLayout';
import { confirmDeliveryAndStock, getAllPurchaseOrders } from '../../services/adminPurchaseOrderService';

/**
 * Presentation Layer - Admin purchase order operations page.
 */
export default function AdminPurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [confirmOrderId, setConfirmOrderId] = useState(null);
  const [confirmOrderItems, setConfirmOrderItems] = useState([]);
  const [batchFormData, setBatchFormData] = useState({});
  const [viewReason, setViewReason] = useState(null);

  useEffect(() => {
    void loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllPurchaseOrders();
      setOrders(data);
    } catch {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmOrderId) return;
    try {
      const items = confirmOrderItems.map((item) => {
        const detail = batchFormData[item.id] || {};
        return {
          itemId: item.id,
          batchNumber: null,
          manufacturingDate: null,
          supplierExpiryDate: detail.supplierExpiryDate || null,
        };
      });

      await confirmDeliveryAndStock(confirmOrderId, { items });
      toast.success('Stock updated and batches created successfully!');
      await loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm delivery');
    } finally {
      setConfirmOrderId(null);
      setConfirmOrderItems([]);
      setBatchFormData({});
    }
  };

  const handleConfirm = (order) => {
    setConfirmOrderId(order.id);
    setConfirmOrderItems(order.items || []);

    const initial = {};
    (order.items || []).forEach((item) => {
      initial[item.id] = {
        supplierExpiryDate: item.supplierExpiryDate || '',
      };
    });
    setBatchFormData(initial);
  };

  const handleBatchFieldChange = (itemId, field, value) => {
    setBatchFormData((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const noticedOrders = useMemo(
    () => orders.filter((order) => order.status === 'CANCELLED' && order.supplierNotice),
    [orders]
  );

  const statusCount = useMemo(
    () => ({
      ALL: orders.length,
      PENDING: orders.filter((order) => order.status === 'PENDING').length,
      SHIPPED: orders.filter((order) => order.status === 'SHIPPED').length,
    }),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'ALL') return orders;
    return orders.filter((order) => order.status === activeFilter);
  }, [activeFilter, orders]);

  return (
    <AdminDeliveryLayout
      title="Purchase Orders"
      description="Manage and track your procurement pipeline from farm gate to warehouse shelves."
      breadcrumbCurrent="Purchase Orders"
      breadcrumbItems={[
        { label: 'Dashboard', to: '/admin' },
        { label: 'Inventory', to: '/admin/inventory' },
        { label: 'Purchase Orders' },
      ]}
    >
      {confirmOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[#dce8e3] bg-white shadow-[0_24px_60px_rgba(6,38,30,0.2)]">
            <div className="flex items-center justify-between border-b border-[#e7efeb] bg-[#f8fbf9] px-6 py-4">
              <h3 className="text-lg font-semibold text-[#103a30]">Confirm Delivery &amp; Update Stock</h3>
              <button
                onClick={() => {
                  setConfirmOrderId(null);
                  setConfirmOrderItems([]);
                  setBatchFormData({});
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6f817b] transition hover:bg-white"
                aria-label="Close confirmation dialog"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
              <p className="text-sm text-[#6f817b]">
                Add supplier expiry dates for each delivered item to keep inventory batches traceable.
              </p>
              {confirmOrderItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#e4ebe8] bg-[#f8fbf9] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#153a30]">{item.productName}</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#48655c]">
                      Qty {item.quantity}
                    </span>
                  </div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[#6b7e78]">
                    Supplier Expiry Date
                  </label>
                  <input
                    type="date"
                    value={batchFormData[item.id]?.supplierExpiryDate || ''}
                    onChange={(event) =>
                      handleBatchFieldChange(item.id, 'supplierExpiryDate', event.target.value)
                    }
                    className="w-full rounded-xl border border-[#d4dfdb] bg-white px-3 py-2 text-sm text-[#1f2f2a] focus:border-[#0d4a38] focus:outline-none focus:ring-2 focus:ring-[#dbece5]"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 border-t border-[#e7efeb] bg-[#f8fbf9] px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setConfirmOrderId(null);
                  setConfirmOrderItems([]);
                  setBatchFormData({});
                }}
                className="rounded-xl border border-[#d2ddd8] bg-white px-4 py-2 text-sm font-semibold text-[#526b64] transition hover:bg-[#f1f6f4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="rounded-xl bg-[#0d4a38] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#083a2c]"
              >
                Confirm &amp; Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {viewReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#dce8e3] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e9efec] bg-[#f8fbf9] px-6 py-4">
              <h3 className="text-lg font-semibold text-[#153a30]">Rejection Rationale</h3>
              <button
                onClick={() => setViewReason(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6f817b] transition hover:bg-white"
                aria-label="Close rationale dialog"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="rounded-2xl border border-[#e6ece9] bg-[#f8fbf9] p-4 text-sm leading-relaxed text-[#425d55]">
                {viewReason}
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewReason(null)}
                  className="rounded-xl border border-[#d2ddd8] bg-white px-5 py-2 text-sm font-semibold text-[#526b64] transition hover:bg-[#f1f6f4]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {noticedOrders.length > 0 && (
        <section className="rounded-2xl border border-[#f3c8c8] bg-[#fdecee] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#ba2f2f]">Supplier Attention Required</p>
              <p className="text-xs text-[#8f4040]">
                {noticedOrders
                  .slice(0, 3)
                  .map((order) => `${order.brandName} (${order.id})`)
                  .join(', ')}
                {noticedOrders.length > 3 ? ' and others have reported delays.' : ' have reported stock delays.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const firstOrderWithReason =
                  noticedOrders.find((order) => order.supplierNotice) || noticedOrders[0];
                setViewReason(
                  firstOrderWithReason?.supplierNotice || firstOrderWithReason?.rejectionReason || 'No reason provided'
                );
              }}
              className="text-xs font-semibold text-[#a22f2f] underline decoration-[#e5a9a9] underline-offset-2"
            >
              View Details
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[#e4ebe8] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#edf2f0] px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-[#9be7bf] px-3 py-2 text-sm font-semibold text-[#0d4a38]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12m-8 6h4" />
              </svg>
              Filters
            </button>

            {[
              { key: 'ALL', label: `All POs (${statusCount.ALL})` },
              { key: 'PENDING', label: 'Pending' },
              { key: 'SHIPPED', label: 'Shipped' },
            ].map((filterItem) => (
              <button
                key={filterItem.key}
                type="button"
                onClick={() => setActiveFilter(filterItem.key)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  activeFilter === filterItem.key
                    ? 'bg-[#0d4a38] text-white'
                    : 'bg-[#f4f7f6] text-[#5f7770] hover:bg-[#eaf2ef]'
                }`}
              >
                {filterItem.label}
              </button>
            ))}

            <span className="ml-auto text-xs text-[#6f817b]">Last updated: Just now</span>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-[#7a8a85]">
                <th className="px-4 py-3 sm:px-5">ID</th>
                <th className="px-4 py-3 sm:px-5">Brand Name</th>
                <th className="px-4 py-3 sm:px-5">Items</th>
                <th className="px-4 py-3 sm:px-5">Status</th>
                <th className="px-4 py-3 sm:px-5">Est. Delivery</th>
                <th className="px-4 py-3 text-right sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-10 text-sm text-[#6f817b] sm:px-5" colSpan={6}>
                    Loading purchase orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-sm text-[#6f817b] sm:px-5" colSpan={6}>
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-[#edf2f0] align-top">
                    <td className="px-4 py-4 text-sm font-semibold text-[#1d3a31] sm:px-5">PO-{order.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-[#1d3a31] sm:px-5">{order.brandName}</td>
                    <td className="px-4 py-4 text-sm text-[#5f7770] sm:px-5">
                      <ul className="space-y-0.5">
                        {(order.items || []).map((item) => (
                          <li key={item.id}>• {item.quantity}x {item.productName}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-4 sm:px-5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-4 text-sm text-[#405a52] sm:px-5">{order.estimatedDeliveryTimeline || '—'}</td>
                    <td className="px-4 py-4 text-right sm:px-5">
                      {order.status === 'DELIVERED' ? (
                        <button
                          onClick={() => handleConfirm(order)}
                          className="rounded-xl bg-[#0d4a38] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#083a2c]"
                        >
                          Confirm &amp; Update Stock
                        </button>
                      ) : order.status === 'CANCELLED' ? (
                        <button
                          onClick={() => setViewReason(order.rejectionReason || order.supplierNotice || 'No reason provided')}
                          className="text-sm font-semibold text-[#b53737] underline decoration-[#e3a3a3] underline-offset-2"
                        >
                          Rationale
                        </button>
                      ) : (
                        <span className="text-sm font-semibold text-[#18483a]">Track</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {loading ? (
            <p className="rounded-2xl border border-[#e4ebe8] bg-[#f8fbf9] p-4 text-sm text-[#6f817b]">Loading purchase orders...</p>
          ) : filteredOrders.length === 0 ? (
            <p className="rounded-2xl border border-[#e4ebe8] bg-[#f8fbf9] p-4 text-sm text-[#6f817b]">No purchase orders found.</p>
          ) : (
            filteredOrders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-[#e4ebe8] bg-[#f8fbf9] p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-[#153a30]">PO-{order.id}</p>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-sm font-semibold text-[#1d3a31]">{order.brandName}</p>
                <p className="mt-1 text-xs text-[#6f817b]">{order.estimatedDeliveryTimeline || 'No estimated delivery available'}</p>
                <ul className="mt-3 space-y-1 text-xs text-[#5f7770]">
                  {(order.items || []).map((item) => (
                    <li key={item.id}>• {item.quantity}x {item.productName}</li>
                  ))}
                </ul>
                <div className="mt-4">
                  {order.status === 'DELIVERED' ? (
                    <button
                      onClick={() => handleConfirm(order)}
                      className="w-full rounded-xl bg-[#0d4a38] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#083a2c]"
                    >
                      Confirm &amp; Update Stock
                    </button>
                  ) : order.status === 'CANCELLED' ? (
                    <button
                      onClick={() => setViewReason(order.rejectionReason || order.supplierNotice || 'No reason provided')}
                      className="text-xs font-semibold text-[#b53737] underline decoration-[#e3a3a3] underline-offset-2"
                    >
                      View Rationale
                    </button>
                  ) : (
                    <p className="text-xs font-semibold text-[#18483a]">Track</p>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf2f0] px-4 py-4 text-xs text-[#6f817b] sm:px-5">
          <span>
            Showing 1-{Math.min(filteredOrders.length, 4)} of {filteredOrders.length} purchase orders
          </span>
          <div className="flex items-center gap-2">
            <button className="h-7 w-7 rounded-lg border border-[#d8e2de] text-[#5f7770]" type="button" aria-label="Previous page">
              &lt;
            </button>
            <button className="h-7 min-w-7 rounded-lg bg-[#0d4a38] px-2 text-xs font-semibold text-white" type="button">
              1
            </button>
            <button className="h-7 min-w-7 rounded-lg border border-[#d8e2de] px-2 text-xs font-semibold text-[#5f7770]" type="button">
              2
            </button>
            <button className="h-7 w-7 rounded-lg border border-[#d8e2de] text-[#5f7770]" type="button" aria-label="Next page">
              &gt;
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_1.8fr]">
        <div className="rounded-3xl bg-[linear-gradient(145deg,#083a2c,#0d4a38)] p-5 text-white shadow-[0_20px_32px_rgba(7,45,35,0.35)]">
          <p className="text-sm text-white/80">Total Outflow</p>
          <p className="mt-2 text-4xl font-bold tracking-tight">Rs. 2,84,500</p>
          <p className="mt-2 text-xs text-[#b7dccd]">+12.5% from last month</p>
          <p className="mt-4 text-xs text-[#d2ece2]">3 active suppliers this week</p>
        </div>

        <div className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm">
          <h3 className="text-2xl font-semibold text-[#153a30]">Inventory Replenishment Status</h3>
          <p className="text-xs text-[#7a8a85]">Real-time status of items currently in transit</p>

          <div className="mt-4 space-y-4">
            <ProgressRow label="Perishables" percent={85} />
            <ProgressRow label="Dairy & Poultry" percent={42} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#5f7770]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#0d4a38]" />
              On Track
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#be2f2f]" />
              Delayed (3)
            </span>
          </div>
        </div>
      </section>
    </AdminDeliveryLayout>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || '').toUpperCase();

  const tones = {
    DELIVERED: 'bg-[#c8f0da] text-[#1f6a4d]',
    COMPLETED: 'bg-[#c8f0da] text-[#1f6a4d]',
    PENDING: 'bg-[#f6e2b4] text-[#94601b]',
    SHIPPED: 'bg-[#d9e6ff] text-[#3c5f9e]',
    CANCELLED: 'bg-[#f9d4d8] text-[#ad2c3c]',
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.07em] ${tones[normalized] || 'bg-[#e8efec] text-[#4f6a62]'}`}>
      {normalized || 'UNKNOWN'}
    </span>
  );
}

function ProgressRow({ label, percent }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-[#61766f]">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#e7efeb]">
        <div className="h-2 rounded-full bg-[#0d4a38]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
