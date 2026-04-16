import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getInventory, updateInventory, getProductBatches, quarantineBatch } from '../../services/inventoryService';
import { createPurchaseOrder } from '../../services/adminPurchaseOrderService';

/**
 * Admin Inventory Management page.
 * Displays all products with their current stock quantity and reorder threshold.
 * Supports inline editing of quantity and reorder threshold with audit feedback.
 * Layer: Presentation (Admin)
 */
export default function AdminInventoryPage() {
  const { logout } = useAuth();

  const [inventory, setInventory]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [editItem, setEditItem]       = useState(null);
  const [formValues, setFormValues]   = useState({ quantity: '', reorderThreshold: '' });
  const [saving, setSaving]           = useState(false);

  // Order state
  const [orderItem, setOrderItem]     = useState(null);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [ordering, setOrdering]       = useState(false);

  // Batch drawer state
  const [batchDrawerItem, setBatchDrawerItem]   = useState(null); // inventory row
  const [batches, setBatches]                   = useState([]);
  const [batchesLoading, setBatchesLoading]     = useState(false);
  const [quarantining, setQuarantining]         = useState(null); // batchId being quarantined

  // ── Data fetching ──────────────────────────────────────────────────────────

  /**
   * Loads the full inventory list from the API.
   * Resets error state on each call so stale errors are cleared on refresh.
   */
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

  // ── Handlers ───────────────────────────────────────────────────────────────

  /**
   * Opens the inline edit form for the selected inventory row.
   * Pre-fills inputs with the row's current values.
   *
   * @param {object} item  The inventory row to edit.
   */
  const handleEdit = (item) => {
    setEditItem(item);
    setFormValues({
      quantity: item.quantity,
      reorderThreshold: item.reorderThreshold,
    });
  };

  /** Discards unsaved changes and collapses the edit row. */
  const handleCancelEdit = () => {
    setEditItem(null);
    setFormValues({ quantity: '', reorderThreshold: '' });
  };

  /** Opens the inline ordering form */
  const handleOrder = (item) => {
    if (!item.brandId) {
      toast.error('Cannot create order: missing brand data for product.');
      return;
    }
    setOrderItem(item);
    setOrderQuantity('');
  };

  /** Cancels formatting order */
  const handleCancelOrder = () => {
    setOrderItem(null);
    setOrderQuantity('');
  };

  /** Opens the batch drawer for a product row and loads its batches. */
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

  /** Quarantines a single batch and refreshes the drawer list. */
  const handleQuarantine = async (batchId) => {
    setQuarantining(batchId);
    try {
      const updated = await quarantineBatch(batchDrawerItem.productId, batchId);
      setBatches((prev) => prev.map((b) => (b.id === batchId ? updated : b)));
      toast.success(`Batch ${updated.batchNumber} quarantined.`);
      fetchInventory(); // refresh aggregate stock counts
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to quarantine batch.');
    } finally {
      setQuarantining(null);
    }
  };

  /** Creates purchase order for the row item */
  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!orderQuantity || isNaN(orderQuantity) || parseInt(orderQuantity, 10) <= 0) return;
    setOrdering(true);
    try {
      await createPurchaseOrder({
        brandId: orderItem.brandId,
        items: [{ productId: orderItem.productId, quantity: parseInt(orderQuantity, 10) }]
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

  /**
   * Submits the inventory update for the currently-edited row.
   * Shows a toast on success or failure.
   *
   * @param {Event} e  The form submit event.
   */
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

  // ── Render helpers ─────────────────────────────────────────────────────────

  /** Formats an ISO datetime string to a human-readable local string. */
  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleString() : '—';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
          >
            ← Dashboard
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-lg font-semibold text-gray-800">Inventory Management</h1>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          Logout
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Page heading ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Stock Levels</h2>
            <p className="text-sm text-gray-500 mt-1">
              View and update quantity and reorder thresholds for all products.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link to="/admin/purchase-orders" className="text-sm bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 transition-colors">
              View POs Status
            </Link>
            <button
              onClick={fetchInventory}
              disabled={loading}
              className="text-sm bg-white border border-gray-300 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-50 transition-colors"       
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ── Inventory table ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500 whitespace-nowrap">Product</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 whitespace-nowrap">Category</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500 whitespace-nowrap">Quantity</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500 whitespace-nowrap">Reorder Threshold</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 whitespace-nowrap">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 whitespace-nowrap">Last Updated</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 whitespace-nowrap">Updated By</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {/* Loading skeleton */}
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))}

              {/* Data rows */}
              {!loading &&
                inventory.map((item) => {
                  if (editItem?.productId === item.productId) {
                    return (
                      /* ── Inline edit row ── */
                      <tr key={item.productId} className="bg-amber-50">
                        <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">
                          {item.productName}
                        </td>
                        <td className="px-6 py-3 text-gray-500">{item.category || '—'}</td>

                        {/* Quantity input — form spans across shared form id */}
                        <td className="px-6 py-3">
                          <form id={`inv-edit-form-${item.productId}`} onSubmit={handleSave} className="flex justify-end">
                            <input
                              type="number"
                              min="0"
                              value={formValues.quantity}
                              onChange={(e) =>
                                setFormValues((v) => ({ ...v, quantity: e.target.value }))
                              }
                              className="w-24 border border-gray-300 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              required
                            />
                          </form>
                        </td>

                        {/* Reorder threshold input */}
                        <td className="px-6 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={formValues.reorderThreshold}
                            onChange={(e) =>
                              setFormValues((v) => ({ ...v, reorderThreshold: e.target.value }))
                            }
                            form={`inv-edit-form-${item.productId}`}
                            className="w-24 border border-gray-300 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </td>

                        {/* Spacer columns */}
                        <td className="px-6 py-3" colSpan={3} />

                        {/* Save / Cancel actions */}
                        <td className="px-6 py-3">
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              form={`inv-edit-form-${item.productId}`}
                              disabled={saving}
                              className="text-xs bg-green-600 text-white rounded px-3 py-1.5 hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={saving}
                              className="text-xs bg-white border border-gray-300 text-gray-600 rounded px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 transition-colors"
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
                      /* ── Inline order row ── */
                      <tr key={item.productId} className="bg-purple-50">
                        <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">
                          {item.productName}
                        </td>
                        <td className="px-6 py-3 text-gray-500">{item.category || '—'}</td>

                        {/* Quantity to order */}
                        <td className="px-6 py-3">
                          <form id={`inv-order-form-${item.productId}`} onSubmit={handleSaveOrder} className="flex justify-end gap-2 items-center">
                            <span className="text-xs text-gray-600">Order Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={orderQuantity}
                              onChange={(e) => setOrderQuantity(e.target.value)}
                              className="w-24 border border-gray-300 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              required
                            />
                          </form>
                        </td>

                        {/* Current Reorder Threshold / read only */}
                        <td className="px-6 py-3 text-right text-gray-700">
                          {item.reorderThreshold}
                        </td>

                        <td className="px-6 py-3" colSpan={3} />

                        {/* Order / Cancel actions */}
                        <td className="px-6 py-3">
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              form={`inv-order-form-${item.productId}`}
                              disabled={ordering}
                              className="text-xs bg-purple-600 text-white rounded px-3 py-1.5 hover:bg-purple-700 disabled:opacity-50 transition-colors"
                            >
                              {ordering ? 'Sending…' : 'Send Order'}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelOrder}
                              disabled={ordering}
                              className="text-xs bg-white border border-gray-300 text-gray-600 rounded px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    /* ── Read-only row ── */
                    <tr key={item.productId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{item.category || '—'}</td>

                      {/* Quantity — red when low stock */}
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-semibold ${
                            item.lowStock ? 'text-red-600' : 'text-gray-800'
                          }`}
                        >
                          {item.quantity}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right text-gray-700">
                        {item.reorderThreshold}
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4">
                        {item.lowStock ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
                            ⚠ Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                            ✓ OK
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(item.updatedAt)}
                      </td>

                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {item.updatedBy || '—'}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleOrder(item)}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors"
                          >
                            Order
                          </button>
                          <button
                            onClick={() => handleViewBatches(item)}
                            className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
                          >
                            Batches
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {/* Empty state */}
          {!loading && inventory.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              No products found.
            </div>
          )}
        </div>
      </div>

      {/* ── Batch drawer ── */}
      {batchDrawerItem && (
        <BatchDrawer
          item={batchDrawerItem}
          batches={batches}
          loading={batchesLoading}
          quarantining={quarantining}
          onQuarantine={handleQuarantine}
          onClose={() => setBatchDrawerItem(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   BatchDrawer — slide-over panel listing all
   batches for a product with quarantine action
───────────────────────────────────────────── */

const BATCH_STATUS_STYLES = {
  RECEIVED:     'bg-blue-50 text-blue-700 border-blue-200',
  ACTIVE:       'bg-green-50 text-green-700 border-green-200',
  NEAR_EXPIRY:  'bg-amber-50 text-amber-700 border-amber-200',
  QUARANTINED:  'bg-red-50 text-red-700 border-red-200',
  EXPIRED:      'bg-gray-100 text-gray-500 border-gray-200',
};

function BatchDrawer({ item, batches, loading, quarantining, onQuarantine, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-800">Batch Inventory</h2>
            <p className="text-xs text-gray-500 mt-0.5">{item.productName}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close batch drawer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
          )}

          {!loading && batches.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">
              No batch records found for this product.
            </div>
          )}

          {!loading && batches.length > 0 && (
            <div className="space-y-3">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0 space-y-1 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{batch.batchNumber}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-0.5">
                      {batch.expiryDate && <span>Expires: <span className="text-gray-700">{batch.expiryDate}</span></span>}
                      {batch.manufacturingDate && <span>Mfg: <span className="text-gray-700">{batch.manufacturingDate}</span></span>}
                      <span>Received: <span className="text-gray-700">{batch.receivedQuantity}</span></span>
                      <span>Available: <span className={batch.availableQuantity === 0 ? 'text-red-500 font-medium' : 'text-gray-700'}>{batch.availableQuantity}</span></span>
                    </div>
                    {batch.notes && (
                      <p className="text-xs text-gray-400 italic">{batch.notes}</p>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
