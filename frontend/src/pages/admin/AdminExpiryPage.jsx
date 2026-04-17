import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getExpiryBuckets } from '../../services/adminExpiryService';
import { applyProductDiscount } from '../../services/adminProductService';
import AdminDeliveryLayout from '../../components/admin/delivery/AdminDeliveryLayout';

/**
 * Presentation Layer – Admin expiry dashboard with discount controls.
 */
export default function AdminExpiryPage() {
  const [buckets, setBuckets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingProductId, setEditingProductId] = useState(null);
  const [editingDiscount, setEditingDiscount] = useState('');
  const [applyingProductId, setApplyingProductId] = useState(null);

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
    void fetchBuckets();
  }, []);

  const getSuggestedDiscount = (daysUntilExpiry) => {
    if (daysUntilExpiry <= 1) return 15;
    if (daysUntilExpiry <= 7) return 10;
    return 5;
  };

  const handleApplyDiscount = async (product, directValue = null) => {
    let discountValue;

    if (directValue !== null) {
      discountValue = parseInt(directValue, 10);
    } else {
      if (!editingDiscount && editingDiscount !== '0') {
        toast.error('Please enter a discount percentage');
        return;
      }
      discountValue = parseInt(editingDiscount, 10);
    }

    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      toast.error('Discount must be between 0 and 100');
      return;
    }

    setApplyingProductId(product.id);
    try {
      await applyProductDiscount(product.id, discountValue);

      setBuckets((prev) => ({
        ...prev,
        within1Day: prev.within1Day.map((p) => (p.id === product.id ? { ...p, discountPercentage: discountValue } : p)),
        within7Days: prev.within7Days.map((p) => (p.id === product.id ? { ...p, discountPercentage: discountValue } : p)),
        within30Days: prev.within30Days.map((p) => (p.id === product.id ? { ...p, discountPercentage: discountValue } : p)),
      }));

      toast.success('Discount applied successfully');
      if (directValue === null) {
        setEditingProductId(null);
        setEditingDiscount('');
      }
    } catch {
      toast.error('Failed to apply discount. Please try again.');
    } finally {
      setApplyingProductId(null);
    }
  };

  const BUCKET_STYLES = {
    critical: {
      border: 'border-[#f2cccc]',
      headerBg: 'bg-[#fdecee]',
      badgeCss: 'bg-[#f9d4d8] text-[#ad2c3c]',
      textColor: 'text-[#ad2c3c]',
      icon: 'Critical',
      emptyText: 'No products expiring today or tomorrow.',
    },
    urgent: {
      border: 'border-[#f6e2b4]',
      headerBg: 'bg-[#fdf4e8]',
      badgeCss: 'bg-[#f6e2b4] text-[#94601b]',
      textColor: 'text-[#94601b]',
      icon: 'Urgent',
      emptyText: 'No products expiring within the next 7 days.',
    },
    warning: {
      border: 'border-[#d5dfdb]',
      headerBg: 'bg-[#f8fbf9]',
      badgeCss: 'bg-[#e8efec] text-[#526b64]',
      textColor: 'text-[#526b64]',
      icon: 'Warning',
      emptyText: 'No products expiring within the next 30 days.',
    },
  };

  return (
    <AdminDeliveryLayout
      title="Expiry Management"
      description="Track near-expiry inventory and apply discount actions to reduce waste and improve sell-through."
      breadcrumbCurrent="Expiry"
      breadcrumbItems={[
        { label: 'Dashboard', to: '/admin' },
        { label: 'Expiry' },
      ]}
      actions={
        <button
          onClick={() => void fetchBuckets()}
          className="inline-flex items-center rounded-xl bg-[#0d4a38] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#083a2c]"
        >
          Refresh
        </button>
      }
    >
      {error && (
        <div className="rounded-xl border border-[#f2cccc] bg-[#fdecee] p-4 text-sm text-[#b03a3a]">{error}</div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Total Near-Expiry" value={buckets?.totalNearExpiryCount ?? 0} tone="slate" />
        <MetricCard label="Critical (0-1 days)" value={buckets?.within1Day?.length ?? 0} tone="danger" />
        <MetricCard label="Urgent (2-7 days)" value={buckets?.within7Days?.length ?? 0} tone="warning" />
      </section>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-[#e4ebe8] bg-white" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <BucketSection
            title="Expires today or tomorrow"
            badge="0-1 days"
            accent={BUCKET_STYLES.critical}
            products={buckets?.within1Day ?? []}
            editingProductId={editingProductId}
            editingDiscount={editingDiscount}
            applyingProductId={applyingProductId}
            setEditingProductId={setEditingProductId}
            setEditingDiscount={setEditingDiscount}
            getSuggestedDiscount={getSuggestedDiscount}
            onApply={handleApplyDiscount}
          />

          <BucketSection
            title="Expiring this week"
            badge="2-7 days"
            accent={BUCKET_STYLES.urgent}
            products={buckets?.within7Days ?? []}
            editingProductId={editingProductId}
            editingDiscount={editingDiscount}
            applyingProductId={applyingProductId}
            setEditingProductId={setEditingProductId}
            setEditingDiscount={setEditingDiscount}
            getSuggestedDiscount={getSuggestedDiscount}
            onApply={handleApplyDiscount}
          />

          <BucketSection
            title="Expiring this month"
            badge="8-30 days"
            accent={BUCKET_STYLES.warning}
            products={buckets?.within30Days ?? []}
            editingProductId={editingProductId}
            editingDiscount={editingDiscount}
            applyingProductId={applyingProductId}
            setEditingProductId={setEditingProductId}
            setEditingDiscount={setEditingDiscount}
            getSuggestedDiscount={getSuggestedDiscount}
            onApply={handleApplyDiscount}
          />
        </div>
      )}
    </AdminDeliveryLayout>
  );
}

function BucketSection({
  title,
  badge,
  accent,
  products,
  editingProductId,
  editingDiscount,
  applyingProductId,
  setEditingProductId,
  setEditingDiscount,
  getSuggestedDiscount,
  onApply,
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border ${accent.border} bg-white shadow-sm`}>
      <div className={`flex items-center justify-between px-5 py-4 ${accent.headerBg}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#324c44]">{accent.icon}</span>
          <h3 className="text-sm font-semibold text-[#324c44]">{title}</h3>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${accent.badgeCss}`}>{badge}</span>
        </div>
        <span className="text-xs font-semibold text-[#6f817b]">{products.length} item(s)</span>
      </div>

      {products.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[#6f817b]">{accent.emptyText}</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f5f8f7] text-xs uppercase tracking-wide text-[#7a8a85]">
                <tr>
                  <th className={th}>Product</th>
                  <th className={th}>Brand</th>
                  <th className={th}>Price</th>
                  <th className={th}>Stock</th>
                  <th className={th}>Expiry Date</th>
                  <th className={th}>Days Left</th>
                  <th className={th}>Discount</th>
                  <th className={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isEditing = editingProductId === product.id;
                  const isApplying = applyingProductId === product.id;
                  const suggestedDiscount = getSuggestedDiscount(product.daysUntilExpiry);

                  return (
                    <tr key={product.id} className="border-t border-[#edf2f0]">
                      <td className={tdStrong}>{product.name}</td>
                      <td className={td}>{product.brandName || '—'}</td>
                      <td className={td}>Rs. {Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className={td}>{product.stockQuantity}</td>
                      <td className={td}>{product.expiryDate}</td>
                      <td className={td}>
                        <span className={`font-semibold ${accent.textColor}`}>
                          {product.daysUntilExpiry === 0 ? 'Today' : `${product.daysUntilExpiry}d`}
                        </span>
                      </td>
                      <td className={td}>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editingDiscount}
                              onChange={(event) => setEditingDiscount(event.target.value)}
                              className="h-8 w-16 rounded-lg border border-[#d6e0dc] bg-white px-2 text-center text-xs focus:border-[#0d4a38] focus:outline-none focus:ring-2 focus:ring-[#d8eae3]"
                            />
                            <span className="text-xs text-[#6f817b]">%</span>
                          </div>
                        ) : (
                          <span className={product.discountPercentage ? 'font-semibold text-[#2f7f5f]' : 'text-[#6f817b]'}>
                            {product.discountPercentage ? `${product.discountPercentage}%` : '—'}
                          </span>
                        )}
                      </td>
                      <td className={td}>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => void onApply(product, null)}
                              disabled={isApplying}
                              className="rounded-lg bg-[#0d4a38] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              {isApplying ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingProductId(null);
                                setEditingDiscount('');
                              }}
                              disabled={isApplying}
                              className="rounded-lg border border-[#d5dfdb] bg-white px-2.5 py-1 text-xs font-semibold text-[#526b64]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingProductId(product.id);
                                setEditingDiscount(product.discountPercentage || '');
                              }}
                              className="text-xs font-semibold text-[#526b64] hover:text-[#0d4a38]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => void onApply(product, suggestedDiscount)}
                              disabled={isApplying}
                              className="rounded-lg bg-[#eaf5ef] px-2.5 py-1 text-xs font-semibold text-[#0d4a38]"
                              title={`Apply ${suggestedDiscount}% suggested discount`}
                            >
                              Apply {suggestedDiscount}%
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {products.map((product) => {
              const isEditing = editingProductId === product.id;
              const isApplying = applyingProductId === product.id;
              const suggestedDiscount = getSuggestedDiscount(product.daysUntilExpiry);

              return (
                <article key={product.id} className="rounded-xl border border-[#edf2ef] bg-[#fbfdfc] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1f3b32]">{product.name}</p>
                      <p className="mt-1 text-xs text-[#6f817b]">{product.brandName || 'No brand'}</p>
                    </div>
                    <span className={`text-xs font-semibold ${accent.textColor}`}>
                      {product.daysUntilExpiry === 0 ? 'Today' : `${product.daysUntilExpiry}d`}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#526b64]">Expiry: {product.expiryDate}</p>
                  <p className="mt-1 text-xs text-[#526b64]">Stock: {product.stockQuantity}</p>

                  <div className="mt-3 flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingDiscount}
                          onChange={(event) => setEditingDiscount(event.target.value)}
                          className="h-8 w-16 rounded-lg border border-[#d6e0dc] bg-white px-2 text-center text-xs focus:border-[#0d4a38] focus:outline-none focus:ring-2 focus:ring-[#d8eae3]"
                        />
                        <button
                          onClick={() => void onApply(product, null)}
                          disabled={isApplying}
                          className="rounded-lg bg-[#0d4a38] px-2.5 py-1 text-xs font-semibold text-white"
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingProductId(product.id);
                            setEditingDiscount(product.discountPercentage || '');
                          }}
                          className="text-xs font-semibold text-[#526b64] hover:text-[#0d4a38]"
                        >
                          Edit Discount
                        </button>
                        <button
                          onClick={() => void onApply(product, suggestedDiscount)}
                          disabled={isApplying}
                          className="rounded-lg bg-[#eaf5ef] px-2.5 py-1 text-xs font-semibold text-[#0d4a38]"
                        >
                          Apply {suggestedDiscount}%
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function MetricCard({ label, value, tone }) {
  const toneClass =
    tone === 'danger'
      ? 'bg-[#fdecee] text-[#b03a3a]'
      : tone === 'warning'
        ? 'bg-[#fdf4e8] text-[#94601b]'
        : 'bg-[#f4f7f6] text-[#425d55]';

  return (
    <article className={`rounded-xl border border-[#e4ebe8] px-4 py-3 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </article>
  );
}

const th = 'px-4 py-3 text-left';
const td = 'px-4 py-3 text-[#425d55]';
const tdStrong = 'px-4 py-3 font-semibold text-[#1f3b32]';