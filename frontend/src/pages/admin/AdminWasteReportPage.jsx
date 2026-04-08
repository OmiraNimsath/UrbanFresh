import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getWasteReport } from '../../services/adminWasteService';
import { formatAmount, formatPrice } from '../../utils/priceUtils';

/**
 * Admin Waste Report Page
 * Layer: Presentation (Admin)
 * Displays the full expired-stock waste report:
 *   - KPI cards: total waste value, total wasted units, overall waste %
 *   - Monthly bar chart: waste value per month (chronological)
 *   - Top-wasted products table: ranked by waste value descending
 */
export default function AdminWasteReportPage() {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWasteReport();
      setReport(data);
    } catch {
      setError('Failed to load waste report. Please try again.');
      toast.error('Failed to load waste report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <PageHeader />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6" />
            <div className="h-56 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <PageHeader />
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={fetchReport}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────

  const {
    totalWasteValue,
    totalWastedUnits,
    overallWastePercentage,
    monthlySummaries,
    topWastedProducts,
    generatedAt,
  } = report;

  // Recharts expects plain numbers; convert BigDecimal strings → numbers
  const chartData = (monthlySummaries ?? []).map((m) => ({
    name: m.monthLabel,
    wasteValue: Number(m.wasteValue),
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <PageHeader />
        {generatedAt && (
          <p className="text-xs text-gray-400 -mt-4 mb-8">
            Generated at: {new Date(generatedAt).toLocaleString()}
          </p>
        )}

        {/* ── KPI cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <KpiCard
            icon="♻️"
            label="Total Waste Value"
            value={formatAmount(totalWasteValue)}
            accent="red"
          />
          <KpiCard
            icon="📦"
            label="Total Wasted Units"
            value={totalWastedUnits.toLocaleString()}
            accent="orange"
          />
          <KpiCard
            icon="📊"
            label="Overall Waste %"
            value={`${Number(overallWastePercentage).toFixed(2)}%`}
            accent="yellow"
          />
        </div>

        {/* ── Monthly bar chart ────────────────────────────────────────────── */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Waste Value by Month (LKR)
          </h2>
          {chartData.length === 0 ? (
            <p className="text-sm text-gray-400">No monthly data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `Rs. ${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                />
                <Tooltip
                  formatter={(value) => [formatAmount(value), 'Waste Value']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="wasteValue" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* ── Top wasted products table ────────────────────────────────────── */}
        <section className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Top Wasted Products</h2>
            <span className="text-xs text-gray-400">Ranked by waste value (highest first)</span>
          </div>

          {(!topWastedProducts || topWastedProducts.length === 0) ? (
            <p className="px-6 py-8 text-sm text-gray-400">No wasted products recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">#</th>
                    <th className="px-6 py-3 text-left font-medium">Product</th>
                    <th className="px-6 py-3 text-left font-medium">Category</th>
                    <th className="px-6 py-3 text-left font-medium">Brand</th>
                    <th className="px-6 py-3 text-right font-medium">Unit Price</th>
                    <th className="px-6 py-3 text-right font-medium">Wasted Qty</th>
                    <th className="px-6 py-3 text-right font-medium">Waste Value</th>
                    <th className="px-6 py-3 text-left font-medium">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topWastedProducts.map((product, index) => (
                    <tr
                      key={`${product.productId}-${product.monthYear}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white
                            ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-400' : index === 2 ? 'bg-yellow-400' : 'bg-gray-300'}`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">{product.productName}</td>
                      <td className="px-6 py-4 text-gray-500">{product.category}</td>
                      <td className="px-6 py-4 text-gray-500">{product.brandName ?? '—'}</td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        {formatPrice(product.price, product.unit)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-red-600">
                        {product.wastedQuantity.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-red-700">
                        {formatAmount(product.wastedValue)}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{product.expiryDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Back link */}
        <Link
          to="/admin"
          className="text-sm text-green-600 hover:text-green-800 font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

/**
 * Page header: title + back breadcrumb.
 */
function PageHeader() {
  return (
    <div className="mb-8">
      <nav className="text-xs text-gray-400 mb-1">
        <Link to="/admin" className="hover:text-green-600">Dashboard</Link>
        <span className="mx-1">›</span>
        <span>Waste Report</span>
      </nav>
      <h1 className="text-3xl font-bold text-gray-800">Waste Report Dashboard</h1>
      <p className="text-sm text-gray-500 mt-1">
        Approved products that expired with remaining stock (valued waste)
      </p>
    </div>
  );
}

const ACCENT_CLASSES = {
  red:    { border: 'border-red-400',    bg: 'bg-red-50',    value: 'text-red-700' },
  orange: { border: 'border-orange-400', bg: 'bg-orange-50', value: 'text-orange-700' },
  yellow: { border: 'border-yellow-400', bg: 'bg-yellow-50', value: 'text-yellow-700' },
};

/**
 * KPI summary card.
 * @param {string} icon    - emoji icon
 * @param {string} label   - metric name
 * @param {string} value   - pre-formatted display value
 * @param {string} accent  - one of 'red' | 'orange' | 'yellow'
 */
function KpiCard({ icon, label, value, accent }) {
  const cls = ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.red;
  return (
    <div className={`${cls.bg} border-l-4 ${cls.border} bg-white rounded-lg shadow-sm p-6`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${cls.value}`}>{value}</p>
    </div>
  );
}
