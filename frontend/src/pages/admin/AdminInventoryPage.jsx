import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getInventory, updateInventory } from '../../services/inventoryService';

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
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="text-sm bg-white border border-gray-300 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            ↻ Refresh
          </button>
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
                inventory.map((item) =>
                  editItem?.productId === item.productId ? (
                    /* ── Inline edit row ── */
                    <tr key={item.productId} className="bg-amber-50">
                      <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {item.productName}
                      </td>
                      <td className="px-6 py-3 text-gray-500">{item.category || '—'}</td>

                      {/* Quantity input — form spans across shared form id */}
                      <td className="px-6 py-3">
                        <form id="inv-edit-form" onSubmit={handleSave} className="flex justify-end">
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
                          form="inv-edit-form"
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
                            form="inv-edit-form"
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
                  ) : (
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
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                )}
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
    </div>
  );
}
