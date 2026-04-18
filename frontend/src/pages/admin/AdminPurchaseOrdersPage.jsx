import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 4;
  const [confirmOrderId, setConfirmOrderId] = useState(null);
  const [confirmOrderItems, setConfirmOrderItems] = useState([]);
  const [batchFormData, setBatchFormData] = useState({});
  const [viewReason, setViewReason] = useState(null);

  useEffect(() => {
    void loadOrders();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [activeFilter, search]);

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

  const statusCount = useMemo(
    () => ({
      ALL: orders.length,
      PENDING: orders.filter((order) => order.status === 'PENDING').length,
      ACCEPTED: orders.filter((order) => order.status === 'ACCEPTED').length,
      SHIPPED: orders.filter((order) => order.status === 'SHIPPED').length,
      DELIVERED: orders.filter((order) => order.status === 'DELIVERED').length,
      COMPLETED: orders.filter((order) => order.status === 'COMPLETED').length,
      CANCELLED: orders.filter((order) => order.status === 'CANCELLED').length,
    }),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    let result = activeFilter === 'ALL' ? [...orders] : orders.filter((o) => o.status === activeFilter);
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (o) =>
          `PO-${o.id}`.toLowerCase().includes(q) ||
          (o.brandName || '').toLowerCase().includes(q) ||
          (o.items || []).some((item) => item.productName?.toLowerCase().includes(q)),
      );
    }
    result.sort((a, b) => {
      if (sortField === 'id') return sortDir === 'asc' ? a.id - b.id : b.id - a.id;
      const av = sortField === 'brand' ? (a.brandName || '') : (a.status || '');
      const bv = sortField === 'brand' ? (b.brandName || '') : (b.status || '');
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [activeFilter, orders, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

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
      actions={
        <Link
          to="/admin/inventory"
          className="inline-flex items-center gap-2 rounded-xl border border-[#d4dfdb] bg-white px-4 py-2 text-sm font-semibold text-[#0d4a38] transition hover:bg-[#f1f6f4]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Inventory
        </Link>
      }
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



      <section className="rounded-2xl border border-[#e4ebe8] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#edf2f0] px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'ALL', label: `All POs (${statusCount.ALL})` },
              { key: 'PENDING', label: 'Pending' },
              { key: 'ACCEPTED', label: 'Accepted' },
              { key: 'SHIPPED', label: 'Shipped' },
              { key: 'DELIVERED', label: 'Delivered' },
              { key: 'COMPLETED', label: 'Completed' },
              { key: 'CANCELLED', label: 'Cancelled' },
            ].map((filterItem) => (
              <button
                key={filterItem.key}
                type="button"
                onClick={() => { setActiveFilter(filterItem.key); setCurrentPage(1); }}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  activeFilter === filterItem.key
                    ? 'bg-[#0d4a38] text-white'
                    : 'bg-[#f4f7f6] text-[#5f7770] hover:bg-[#eaf2ef]'
                }`}
              >
                {filterItem.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8fa89f]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Search by PO#, brand or item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-[#dce8e3] bg-[#f4f7f6] pl-9 pr-3 text-sm text-[#5f7770] focus:outline-none"
              />
            </div>
            <select
              value={`${sortField}:${sortDir}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split(':');
                setSortField(f); setSortDir(d); setCurrentPage(1);
              }}
              className="h-9 rounded-xl border border-[#dce8e3] bg-[#f4f7f6] px-3 text-sm text-[#5f7770] focus:outline-none"
            >
              <option value="id:desc">Newest first</option>
              <option value="id:asc">Oldest first</option>
              <option value="brand:asc">Brand A–Z</option>
              <option value="brand:desc">Brand Z–A</option>
              <option value="status:asc">Status A–Z</option>
            </select>
            <span className="ml-auto text-xs text-[#6f817b]">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</span>
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
                    {orders.length === 0 ? 'No purchase orders found.' : 'No orders match your search or filter.'}
                  </td>
                </tr>
              ) : (
                pagedOrders.map((order) => (
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
                      ) : null}
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
            <p className="rounded-2xl border border-[#e4ebe8] bg-[#f8fbf9] p-4 text-sm text-[#6f817b]">{orders.length === 0 ? 'No purchase orders found.' : 'No orders match your search or filter.'}</p>
          ) : (
            pagedOrders.map((order) => (
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
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf2f0] px-4 py-4 text-xs text-[#6f817b] sm:px-5">
          <span>
            Showing {filteredOrders.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length} purchase orders
          </span>
          <div className="flex items-center gap-2">
            <button
              className="h-7 w-7 rounded-lg border border-[#d8e2de] text-[#5f7770] disabled:opacity-40"
              type="button"
              aria-label="Previous page"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`h-7 min-w-7 rounded-lg px-2 text-xs font-semibold ${
                  page === currentPage
                    ? 'bg-[#0d4a38] text-white'
                    : 'border border-[#d8e2de] text-[#5f7770] hover:bg-[#f1f6f4]'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              className="h-7 w-7 rounded-lg border border-[#d8e2de] text-[#5f7770] disabled:opacity-40"
              type="button"
              aria-label="Next page"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              &gt;
            </button>
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
