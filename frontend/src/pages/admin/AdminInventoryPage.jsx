import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiDatabase, FiAlertTriangle, FiCheckCircle, FiSearch } from 'react-icons/fi';
import { getInventory, updateInventory, getProductBatches } from '../../services/inventoryService';
import { createPurchaseOrder } from '../../services/adminPurchaseOrderService';
import AdminDeliveryLayout from '../../components/admin/delivery/AdminDeliveryLayout';

/**
 * Admin Inventory Management page.
 * Displays all products with their current stock quantity and reorder threshold.
 * Supports inline editing of quantity and reorder threshold with audit feedback.
 * Layer: Presentation (Admin)
 */
export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [formValues, setFormValues] = useState({ quantity: '', reorderThreshold: '' });
  const [saving, setSaving] = useState(false);

  const [orderItem, setOrderItem] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [ordering, setOrdering] = useState(false);

  const [batchDrawerItem, setBatchDrawerItem] = useState(null);
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState('productName');
  const [sortDir, setSortDir] = useState('asc');
  const [invPage, setInvPage] = useState(0);
  const INV_PAGE_SIZE = 10;

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInventory();
      setInventory(data);
    } catch {
      setError('Failed to load inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleEdit = (item) => {
    setEditItem(item);
    setFormValues({
      quantity: item.quantity,
      reorderThreshold: item.reorderThreshold,
    });
  };

  const handleCancelEdit = () => {
    setEditItem(null);
    setFormValues({ quantity: '', reorderThreshold: '' });
  };

  const handleOrder = (item) => {
    if (!item.brandId) {
      toast.error('Cannot create order: missing brand data for product.');
      return;
    }
    setOrderItem(item);
    setOrderQuantity('');
  };

  const handleCancelOrder = () => {
    setOrderItem(null);
    setOrderQuantity('');
  };

  const handleViewBatches = async (item) => {
    setBatchDrawerItem(item);
    setBatches([]);
    setBatchesLoading(true);
    try {
      const data = await getProductBatches(item.productId);
      setBatches(data);
    } catch {
      toast.error('Failed to load batches.');
    } finally {
      setBatchesLoading(false);
    }
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!orderQuantity || Number.isNaN(Number(orderQuantity)) || parseInt(orderQuantity, 10) <= 0) {
      return;
    }

    setOrdering(true);
    try {
      await createPurchaseOrder({
        brandId: orderItem.brandId,
        items: [{ productId: orderItem.productId, quantity: parseInt(orderQuantity, 10) }],
      });
      toast.success(`Purchase order created for ${orderItem.productName}`);
      setOrderItem(null);
      fetchInventory();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create order');
    } finally {
      setOrdering(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateInventory(editItem.productId, {
        quantity: parseInt(formValues.quantity, 10),
        reorderThreshold: parseInt(formValues.reorderThreshold, 10),
      });
      toast.success(`Inventory updated for "${editItem.productName}"`);
      setEditItem(null);
      fetchInventory();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update inventory.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

  const lowStockCount = inventory.filter((item) => item.lowStock).length;
  const healthyCount = inventory.length - lowStockCount;
  const totalQuantity = inventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const categories = useMemo(
    () => [...new Set(inventory.map((i) => i.category).filter(Boolean))].sort(),
    [inventory]
  );

  const filtered = useMemo(() => {
    let list = inventory;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) => i.productName?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q)
      );
    }
    if (filterCategory) list = list.filter((i) => i.category === filterCategory);
    if (filterStatus === 'low') list = list.filter((i) => i.lowStock);
    else if (filterStatus === 'healthy') list = list.filter((i) => !i.lowStock);
    return [...list].sort((a, b) => {
      let va = a[sortField] ?? '';
      let vb = b[sortField] ?? '';
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [inventory, search, filterCategory, filterStatus, sortField, sortDir]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setInvPage(0); }, [search, filterCategory, filterStatus, sortField, sortDir]);

  const totalInvPages = Math.max(1, Math.ceil(filtered.length / INV_PAGE_SIZE));
  const pagedInventory = filtered.slice(invPage * INV_PAGE_SIZE, (invPage + 1) * INV_PAGE_SIZE);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  return (
    <AdminDeliveryLayout
      title="Inventory Management"
      description="Monitor stock levels, update thresholds, and create purchase orders without leaving this screen."
      breadcrumbCurrent="Inventory"
      actions={
        <>
          <Link
            to="/admin/purchase-orders"
            className="inline-flex items-center rounded-lg border border-[#d4dfdb] bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            View PO Status
          </Link>
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="inline-flex items-center rounded-lg bg-[#0d4a38] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#083a2c] disabled:opacity-50"
          >
            Refresh
          </button>
        </>
      }
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard label="Total Stock Units" value={totalQuantity} tone="default" icon={FiDatabase} />
        <MetricCard label="Low Stock Items" value={lowStockCount} tone="red" icon={FiAlertTriangle} />
        <MetricCard label="Healthy Items" value={healthyCount} tone="green" icon={FiCheckCircle} />
      </section>

      <section className="rounded-2xl border border-[#e4ebe8] bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Stock Levels</h2>
        <p className="mt-1 text-sm text-slate-500">
          View and update quantity and reorder thresholds for all products.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-45 flex-1">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f7770]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product or category…"
              className="w-full rounded-xl border border-[#dce8e3] bg-[#f4f7f6] py-2 pl-9 pr-3 text-sm text-[#5f7770] focus:border-[#0d4a38] focus:outline-none"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-xl border border-[#dce8e3] bg-[#f4f7f6] px-3 py-2 text-sm font-semibold text-[#5f7770] focus:border-[#0d4a38] focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-[#dce8e3] bg-[#f4f7f6] px-3 py-2 text-sm font-semibold text-[#5f7770] focus:border-[#0d4a38] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="low">Low Stock only</option>
            <option value="healthy">In Stock only</option>
          </select>
          <span className="ml-auto text-xs text-[#6f817b]">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="mt-4 hidden overflow-x-auto rounded-xl border border-[#edf2ef] md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <SortableHeader label="Product" field="productName" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Category" field="category" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Quantity" field="quantity" sortField={sortField} sortDir={sortDir} onSort={handleSort} right />
                <SortableHeader label="Reorder Threshold" field="reorderThreshold" sortField={sortField} sortDir={sortDir} onSort={handleSort} right />
                <th className={th}>Status</th>
                <SortableHeader label="Last Updated" field="updatedAt" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th className={th}>Updated By</th>
                <th className={th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-t border-[#edf2ef]">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 w-full rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading &&
                pagedInventory.map((item) => {
                  if (editItem?.productId === item.productId) {
                    return (
                      <tr key={item.productId} className="border-t border-[#edf2ef] bg-amber-50/70">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.productName}</td>
                        <td className="px-4 py-3 text-slate-500">{item.category || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <form id={`inv-edit-form-${item.productId}`} onSubmit={handleSave} className="inline-flex">
                            <input
                              type="number"
                              min="0"
                              value={formValues.quantity}
                              onChange={(e) => setFormValues((v) => ({ ...v, quantity: e.target.value }))}
                              className="w-24 rounded-md border border-[#d4dfdb] bg-white px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#0d4a38]/40"
                              required
                            />
                          </form>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={formValues.reorderThreshold}
                            onChange={(e) => setFormValues((v) => ({ ...v, reorderThreshold: e.target.value }))}
                            form={`inv-edit-form-${item.productId}`}
                            className="w-24 rounded-md border border-[#d4dfdb] bg-white px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#0d4a38]/40"
                            required
                          />
                        </td>
                        <td className="px-4 py-3" colSpan={3} />
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              form={`inv-edit-form-${item.productId}`}
                              disabled={saving}
                              className="rounded bg-[#0d4a38] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#083a2c] disabled:opacity-50"
                            >
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={saving}
                              className="rounded border border-[#d4dfdb] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  if (orderItem?.productId === item.productId) {
                    return (
                      <tr key={item.productId} className="border-t border-[#edf2ef] bg-purple-50/70">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.productName}</td>
                        <td className="px-4 py-3 text-slate-500">{item.category || '—'}</td>
                        <td className="px-4 py-3" colSpan={2}>
                          <form id={`inv-order-form-${item.productId}`} onSubmit={handleSaveOrder} className="flex items-center justify-end gap-2">
                            <span className="text-xs text-slate-600">Order Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={orderQuantity}
                              onChange={(e) => setOrderQuantity(e.target.value)}
                              className="w-24 rounded-md border border-[#d4dfdb] bg-white px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                              required
                            />
                          </form>
                        </td>
                        <td className="px-4 py-3" colSpan={3} />
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              form={`inv-order-form-${item.productId}`}
                              disabled={ordering}
                              className="rounded bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                            >
                              {ordering ? 'Sending…' : 'Send Order'}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelOrder}
                              disabled={ordering}
                              className="rounded border border-[#d4dfdb] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={item.productId} className="border-t border-[#edf2ef]">
                      <td className="px-4 py-4 font-medium text-slate-900">{item.productName}</td>
                      <td className="px-4 py-4 text-slate-500">{item.category || '—'}</td>
                      <td className="px-4 py-4 text-right">
                        <span className={item.lowStock ? 'font-semibold text-red-600' : 'font-semibold text-slate-800'}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-slate-700">{item.reorderThreshold}</td>
                      <td className="px-4 py-4">
                        {item.lowStock ? (
                          <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">{formatDate(item.updatedAt)}</td>
                      <td className="px-4 py-4 text-xs text-slate-500">{item.updatedBy || '—'}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(item)} className="text-xs font-semibold text-[#0d4a38] hover:underline">Edit</button>
                          <button onClick={() => handleOrder(item)} className="text-xs font-semibold text-purple-700 hover:underline">Order</button>
                          <button onClick={() => handleViewBatches(item)} className="text-xs font-semibold text-amber-700 hover:underline">Batches</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-slate-400">No products found.</div>
          )}
        </div>

        <div className="mt-4 space-y-3 md:hidden">
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
            ))}

          {!loading && filtered.length === 0 && (
            <div className="rounded-xl border border-[#edf2ef] p-6 text-center text-sm text-slate-500">No products found.</div>
          )}

          {!loading &&
            pagedInventory.map((item) => (
              <article key={item.productId} className="rounded-xl border border-[#edf2ef] bg-[#fbfdfc] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.productName}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.category || 'No category'}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.lowStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {item.lowStock ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <p>Quantity: <span className={item.lowStock ? 'font-semibold text-red-600' : 'font-semibold text-slate-800'}>{item.quantity}</span></p>
                  <p>Threshold: <span className="font-semibold text-slate-800">{item.reorderThreshold}</span></p>
                  <p className="col-span-2">Updated: <span className="font-medium text-slate-700">{formatDate(item.updatedAt)}</span></p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleEdit(item)} className="text-xs font-semibold text-[#0d4a38] hover:underline">Edit</button>
                  <button onClick={() => handleOrder(item)} className="text-xs font-semibold text-purple-700 hover:underline">Order</button>
                  <button onClick={() => handleViewBatches(item)} className="text-xs font-semibold text-amber-700 hover:underline">Batches</button>
                </div>
              </article>
            ))}
        </div>

        {!loading && totalInvPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <span>Page {invPage + 1} of {totalInvPages} · {filtered.length} items</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInvPage((p) => p - 1)}
                disabled={invPage === 0}
                className="rounded-lg border border-[#d4dfdb] px-3 py-1.5 text-sm transition hover:bg-slate-50 disabled:opacity-40"
              >Prev</button>
              <button
                onClick={() => setInvPage((p) => p + 1)}
                disabled={invPage >= totalInvPages - 1}
                className="rounded-lg border border-[#d4dfdb] px-3 py-1.5 text-sm transition hover:bg-slate-50 disabled:opacity-40"
              >Next</button>
            </div>
          </div>
        )}
      </section>

      {batchDrawerItem && (
        <BatchDrawer
          item={batchDrawerItem}
          batches={batches}
          loading={batchesLoading}
          onClose={() => setBatchDrawerItem(null)}
        />
      )}
    </AdminDeliveryLayout>
  );
}

function MetricCard({ label, value, tone, icon: Icon }) {
  const toneClass =
    tone === 'red'
      ? 'bg-[#fdecee] text-red-700'
      : tone === 'green'
        ? 'bg-[#eaf5ef] text-[#0d4a38]'
        : 'bg-white text-slate-900';

  return (
    <article className={`rounded-xl border border-[#e4ebe8] px-4 py-3 ${toneClass}`}>
      {Icon && <Icon className="mb-2 h-5 w-5 opacity-80" />}
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </article>
  );
}

/*
 * BatchDrawer — slide-over panel listing all
 * batches for a product.
 */
function BatchDrawer({ item, batches, loading, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative h-full w-full max-w-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e4ebe8] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Batch Inventory</h2>
            <p className="mt-0.5 text-xs text-slate-500">{item.productName}</p>
          </div>
          <button onClick={onClose} aria-label="Close batch drawer" className="text-slate-400 transition hover:text-slate-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="h-[calc(100%-73px)] overflow-y-auto px-6 py-4">
          {loading && (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-slate-100" />
              ))}
            </div>
          )}

          {!loading && batches.length === 0 && (
            <div className="py-16 text-center text-sm text-slate-500">No batch records found for this product.</div>
          )}

          {!loading && batches.length > 0 && (
            <div className="space-y-3">
              {batches.map((batch) => (
                <article key={batch.id} className="rounded-lg border border-[#e4ebe8] p-4">
                  <p className="text-sm font-semibold text-slate-900">{batch.batchNumber}</p>
                  <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-500 sm:grid-cols-2">
                    {batch.expiryDate && (
                      <p>
                        Expires: <span className="font-medium text-slate-700">{batch.expiryDate}</span>
                      </p>
                    )}
                    {batch.manufacturingDate && (
                      <p>
                        Mfg: <span className="font-medium text-slate-700">{batch.manufacturingDate}</span>
                      </p>
                    )}
                    <p>
                      Received: <span className="font-medium text-slate-700">{batch.receivedQuantity}</span>
                    </p>
                    <p>
                      Available:{' '}
                      <span className={batch.availableQuantity === 0 ? 'font-medium text-red-600' : 'font-medium text-slate-700'}>
                        {batch.availableQuantity}
                      </span>
                    </p>
                  </div>
                  {batch.notes && <p className="mt-2 text-xs italic text-slate-400">{batch.notes}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableHeader({ label, field, sortField, sortDir, onSort, right }) {
  const active = sortField === field;
  const base = 'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 cursor-pointer select-none';
  return (
    <th className={`${base} ${right ? 'text-right' : 'text-left'}`} onClick={() => onSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={active ? 'text-[#0d4a38]' : 'text-slate-300'}>
          {active && sortDir === 'desc' ? '▼' : '▲'}
        </span>
      </span>
    </th>
  );
}

const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
