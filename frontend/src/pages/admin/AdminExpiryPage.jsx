import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getExpiryBuckets } from '../../services/adminExpiryService';
import { updateProduct } from '../../services/adminProductService';

/**
 * Admin Expiry Dashboard page.
 * Layer: Presentation (Admin)
 * Displays in-stock approved products grouped into three urgency buckets so
 * the admin can take timely action (promotions, markdowns) to reduce waste.
 *
 * Buckets (non-overlapping):
 *   Critical  — expires today or tomorrow (0–1 days)
 *   Urgent    — expires in 2–7 days
 *   Warning   — expires in 8–30 days
 */
export default function AdminExpiryPage() {
  const { logout } = useAuth();

  const [buckets, setBuckets]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Discount editing state
  const [editingProductId, setEditingProductId]     = useState(null);
  const [editingDiscount, setEditingDiscount]       = useState('');
  const [applyingProductId, setApplyingProductId]   = useState(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  /**
   * Loads all three expiry buckets from the API.
   * Clears stale error state on each call.
   */
  const fetchBuckets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExpiryBuckets();
      setBuckets(data);
    } catch {
      setError('Failed to load expiry data. Please try again.');
      toast.error('Failed to load expiry data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuckets();
  }, []);

  // ── Suggested discount calculation ─────────────────────────────────────────

  /**
   * Determines the suggested discount percentage based on days until expiry.
   * Critical (0-1d): 15%, Urgent (2-7d): 10%, Warning (8-30d): 5%
   */
  const getSuggestedDiscount = (daysUntilExpiry) => {
    if (daysUntilExpiry <= 1) return 15;
    if (daysUntilExpiry <= 7) return 10;
    return 5;
  };

  /**
   * Handler to apply/update discount for a product.
   * Calls backend API to update the product with new discountPercentage.
   */
  const handleApplyDiscount = async (product) => {
    if (!editingDiscount && editingDiscount !== '0') {
      toast.error('Please enter a discount percentage');
      return;
    }

    const discountValue = parseInt(editingDiscount, 10);
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      toast.error('Discount must be between 0 and 100');
      return;
    }

    setApplyingProductId(product.id);
    try {
      // Build full product update payload
      const updatePayload = {
        name: product.name,
        price: product.price,
        category: product.category,
        brandId: null, // Keep as-is
        unit: product.unit,
        featured: false,
        expiryDate: product.expiryDate,
        stockQuantity: product.stockQuantity,
        discountPercentage: discountValue,
      };

      await updateProduct(product.id, updatePayload);
      
      // Update local state to reflect change immediately
      setBuckets(prev => ({
        ...prev,
        within1Day: prev.within1Day.map(p => p.id === product.id ? { ...p, discountPercentage: discountValue } : p),
        within7Days: prev.within7Days.map(p => p.id === product.id ? { ...p, discountPercentage: discountValue } : p),
        within30Days: prev.within30Days.map(p => p.id === product.id ? { ...p, discountPercentage: discountValue } : p),
      }));

      toast.success(`Discount applied successfully`);
      setEditingProductId(null);
      setEditingDiscount('');
    } catch (err) {
      console.error('Failed to apply discount:', err);
      toast.error('Failed to apply discount. Please try again.');
    } finally {
      setApplyingProductId(null);
    }
  };

  // ── Sub-components ─────────────────────────────────────────────────────────

  /**
   * Renders one urgency bucket section with a colour-coded header and a product table.
   *
   * @param {object}   props
   * @param {string}   props.title       – Section heading (e.g. "Critical — expires today or tomorrow")
   * @param {string}   props.accent      – Tailwind colour token used for the left border + badge
   * @param {string}   props.badge       – Short label shown on the header chip (e.g. "0–1 day")
   * @param {string}   props.emptyLabel  – Message when the bucket is empty
   * @param {Array}    props.products    – Product rows for this bucket
   */
  const BucketSection = ({ title, accent, badge, emptyLabel, products }) => (
    <section className={`bg-white rounded-lg shadow-sm border-l-4 ${accent.border} overflow-hidden`}>
      {/* Bucket header */}
      <div className={`px-6 py-4 flex items-center justify-between ${accent.headerBg}`}>
        <div className="flex items-center gap-3">
          <span className="text-xl">{accent.icon}</span>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${accent.badgeCss}`}>
            {badge}
          </span>
        </div>
        <span className="text-sm font-semibold text-gray-600">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Product table */}
      {products.length === 0 ? (
        <p className="px-6 py-5 text-sm text-gray-400">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Product</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Brand</th>
                <th className="px-6 py-3 text-center">Price</th>
                <th className="px-6 py-3 text-center">Stock</th>
                <th className="px-6 py-3 text-center">Expiry Date</th>
                <th className="px-6 py-3 text-center">Days Left</th>
                <th className="px-6 py-3 text-center">Discount</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => (
                <ProductRow
                  key={product.id}
                  product={product}
                  accentText={accent.textColor}
                  isEditing={editingProductId === product.id}
                  editingDiscount={editingDiscount}
                  isApplying={applyingProductId === product.id}
                  suggestedDiscount={getSuggestedDiscount(product.daysUntilExpiry)}
                  onEditStart={() => {
                    setEditingProductId(product.id);
                    setEditingDiscount(product.discountPercentage || '');
                  }}
                  onDiscountChange={(value) => setEditingDiscount(value)}
                  onApply={() => handleApplyDiscount(product)}
                  onCancel={() => {
                    setEditingProductId(null);
                    setEditingDiscount('');
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  /**
   * Renders one product row inside a bucket table with discount controls.
   *
   * @param {object} props
   * @param {object} props.product            – ExpiryProductResponse from the API
   * @param {string} props.accentText         – Tailwind text-colour class for the days-left badge
   * @param {boolean} props.isEditing         – Whether this product is in edit mode
   * @param {string|number} props.editingDiscount – Current input value when editing
   * @param {boolean} props.isApplying        – Whether applying this product's discount (loading)
   * @param {number} props.suggestedDiscount  – Suggested discount % for this product
   * @param {function} props.onEditStart      – Called to enter edit mode
   * @param {function} props.onDiscountChange – Called when discount input changes
   * @param {function} props.onApply          – Called to save discount
   * @param {function} props.onCancel         – Called to exit edit mode
   */
  const ProductRow = ({ 
    product, 
    accentText, 
    isEditing, 
    editingDiscount, 
    isApplying,
    suggestedDiscount,
    onEditStart, 
    onDiscountChange, 
    onApply, 
    onCancel 
  }) => (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-3 font-medium text-gray-800">{product.name}</td>
      <td className="px-6 py-3 text-gray-500">{product.category || '—'}</td>
      <td className="px-6 py-3 text-gray-500">{product.brandName || '—'}</td>
      <td className="px-6 py-3 text-center text-gray-700">
        Rs. {Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        <span className="text-xs text-gray-400 ml-1">/{formatUnit(product.unit)}</span>
      </td>
      <td className="px-6 py-3 text-center text-gray-700">{product.stockQuantity}</td>
      <td className="px-6 py-3 text-center text-gray-600">{product.expiryDate}</td>
      <td className="px-6 py-3 text-center">
        <span className={`font-bold ${accentText}`}>
          {product.daysUntilExpiry === 0
            ? 'Today'
            : `${product.daysUntilExpiry}d`}
        </span>
      </td>
      <td className="px-6 py-3 text-center">
        {isEditing ? (
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              value={editingDiscount}
              onChange={(e) => onDiscountChange(e.target.value)}
              className="w-16 px-2 py-1 border border-green-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0"
            />
            <span className="text-xs text-gray-500">%</span>
            <span className="text-xs text-gray-400">
              (suggest: {suggestedDiscount}%)
            </span>
          </div>
        ) : (
          <span className={product.discountPercentage ? 'font-semibold text-green-600' : 'text-gray-500'}>
            {product.discountPercentage ? `${product.discountPercentage}%` : '—'}
          </span>
        )}
      </td>
      <td className="px-6 py-3 text-center">
        {isEditing ? (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onApply}
              disabled={isApplying}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium py-1 px-3 rounded transition-colors"
            >
              {isApplying ? 'Saving...' : 'Apply'}
            </button>
            <button
              onClick={onCancel}
              disabled={isApplying}
              className="bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-800 text-xs font-medium py-1 px-3 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={onEditStart}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1 px-3 rounded transition-colors"
          >
            Edit
          </button>
        )}
      </td>
    </tr>
  );

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Converts PricingUnit enum values to short display strings. */
  const formatUnit = (unit) => {
    const map = {
      PER_ITEM: 'item',
      PER_KG: 'kg',
      PER_G: 'g',
      PER_L: 'L',
      PER_ML: 'mL',
    };
    return map[unit] ?? unit;
  };

  // ── Bucket style config ────────────────────────────────────────────────────

  const BUCKET_STYLES = {
    critical: {
      border: 'border-red-500',
      headerBg: 'bg-red-50',
      badgeCss: 'bg-red-100 text-red-700',
      textColor: 'text-red-600',
      icon: '🚨',
    },
    urgent: {
      border: 'border-orange-400',
      headerBg: 'bg-orange-50',
      badgeCss: 'bg-orange-100 text-orange-700',
      textColor: 'text-orange-600',
      icon: '⚠️',
    },
    warning: {
      border: 'border-yellow-400',
      headerBg: 'bg-yellow-50',
      badgeCss: 'bg-yellow-100 text-yellow-700',
      textColor: 'text-yellow-600',
      icon: '📅',
    },
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
              ← Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-semibold text-gray-800">Expiry Dashboard</h1>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
              ← Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-semibold text-gray-800">Expiry Dashboard</h1>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={fetchBuckets}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

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
          <h1 className="text-lg font-semibold text-gray-800">Expiry Dashboard</h1>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          Logout
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Page heading + summary ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Near-Expiry Products</h2>
            <p className="text-sm text-gray-500 mt-1">
              In-stock products expiring within the next 30 days. Act now to reduce waste.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-2xl font-bold text-gray-800">{buckets?.totalNearExpiryCount ?? 0}</span>
            <span className="text-sm text-gray-500">total near-expiry</span>
          </div>
        </div>

        {/* ── Bucket sections ── */}
        <div className="space-y-6">
          <BucketSection
            title="Critical — expires today or tomorrow"
            badge="0–1 day"
            accent={BUCKET_STYLES.critical}
            emptyLabel="No products expiring today or tomorrow."
            products={buckets?.within1Day ?? []}
          />

          <BucketSection
            title="Urgent — expiring this week"
            badge="2–7 days"
            accent={BUCKET_STYLES.urgent}
            emptyLabel="No products expiring within the next 7 days."
            products={buckets?.within7Days ?? []}
          />

          <BucketSection
            title="Warning — expiring this month"
            badge="8–30 days"
            accent={BUCKET_STYLES.warning}
            emptyLabel="No products expiring within the next 30 days."
            products={buckets?.within30Days ?? []}
          />
        </div>

      </div>
    </div>
  );
}
