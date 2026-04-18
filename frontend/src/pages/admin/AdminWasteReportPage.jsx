import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiTrash2, FiPackage } from 'react-icons/fi';
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
import AdminDeliveryLayout from '../../components/admin/delivery/AdminDeliveryLayout';

/**
 * Presentation Layer – Admin waste report dashboard.
 */
export default function AdminWasteReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    void fetchReport();
  }, []);

  const totalWasteValue = report?.totalWasteValue ?? 0;
  const totalWastedUnits = report?.totalWastedUnits ?? 0;
  const topWastedProducts = report?.topWastedProducts ?? [];

  const chartData = (report?.monthlySummaries ?? []).map((monthData) => ({
    name: monthData.monthLabel,
    wasteValue: Number(monthData.wasteValue),
  }));

  return (
    <AdminDeliveryLayout
      title="Waste Report Dashboard"
      description="Track expired inventory impact by value and product to reduce losses through better replenishment planning."
      breadcrumbCurrent="Waste Report"
      breadcrumbItems={[
        { label: 'Dashboard', to: '/admin' },
        { label: 'Waste Report' },
      ]}
      actions={
        <button
          onClick={() => void fetchReport()}
          className="inline-flex items-center rounded-xl bg-[#0d4a38] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#083a2c]"
        >
          Refresh
        </button>
      }
    >
      {error && (
        <div className="rounded-xl border border-[#f2cccc] bg-[#fdecee] p-4 text-sm text-[#b03a3a]">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-[#e4ebe8] bg-white" />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-2xl border border-[#e4ebe8] bg-white" />
          <div className="h-80 animate-pulse rounded-2xl border border-[#e4ebe8] bg-white" />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-4">
            <MetricCard icon={<FiTrash2 className="h-5 w-5" />} label="Total Waste Value" value={formatAmount(totalWasteValue)} tone="danger" />
            <MetricCard icon={<FiPackage className="h-5 w-5" />} label="Total Wasted Units" value={Number(totalWastedUnits).toLocaleString()} tone="warning" />
          </section>

          <section className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#153a30]">Waste Value by Month (LKR)</h2>
            {report?.generatedAt ? (
              <p className="mt-1 text-xs text-[#6f817b]">Generated at: {new Date(report.generatedAt).toLocaleString()}</p>
            ) : null}

            {chartData.length === 0 ? (
              <p className="mt-6 text-sm text-[#6f817b]">No monthly data available.</p>
            ) : (
              <div className="mt-6 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf2f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#6f817b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) => `Rs. ${(value / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11, fill: '#6f817b' }}
                      axisLine={false}
                      tickLine={false}
                      width={72}
                    />
                    <Tooltip
                      formatter={(value) => [formatAmount(value), 'Waste Value']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e4ebe8',
                        fontSize: '13px',
                      }}
                    />
                    <Bar dataKey="wasteValue" fill="#ba3a3a" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#e4ebe8] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#edf2f0] px-5 py-4">
              <h2 className="text-lg font-semibold text-[#153a30]">Top Wasted Products</h2>
              <span className="text-xs text-[#6f817b]">Ranked by waste value</span>
            </div>

            {topWastedProducts.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#6f817b]">No wasted products recorded.</p>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#f5f8f7] text-xs uppercase tracking-wide text-[#7a8a85]">
                      <tr>
                        <th className={th}>#</th>
                        <th className={th}>Product</th>
                        <th className={th}>Category</th>
                        <th className={th}>Brand</th>
                        <th className={`${th} text-right`}>Unit Price</th>
                        <th className={`${th} text-right`}>Wasted Qty</th>
                        <th className={`${th} text-right`}>Waste Value</th>
                        <th className={th}>Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topWastedProducts.map((product, index) => (
                        <tr key={`${product.productId}-${product.monthYear}`} className="border-t border-[#edf2f0]">
                          <td className={td}>{index + 1}</td>
                          <td className={tdStrong}>{product.productName}</td>
                          <td className={td}>{product.category}</td>
                          <td className={td}>{product.brandName ?? '—'}</td>
                          <td className={`${td} text-right`}>{formatPrice(product.price, product.unit)}</td>
                          <td className={`${td} text-right font-semibold text-[#ba3a3a]`}>{product.wastedQuantity.toLocaleString()}</td>
                          <td className={`${td} text-right font-semibold text-[#ba3a3a]`}>{formatAmount(product.wastedValue)}</td>
                          <td className={td}>{product.expiryDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 p-4 md:hidden">
                  {topWastedProducts.map((product, index) => (
                    <article key={`${product.productId}-${product.monthYear}`} className="rounded-xl border border-[#edf2ef] bg-[#fbfdfc] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#1f3b32]">#{index + 1} {product.productName}</p>
                          <p className="mt-1 text-xs text-[#6f817b]">{product.category} • {product.brandName ?? 'No brand'}</p>
                        </div>
                        <span className="text-xs font-semibold text-[#ba3a3a]">{formatAmount(product.wastedValue)}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#526b64]">
                        <p>Unit: <span className="font-medium text-[#324c44]">{formatPrice(product.price, product.unit)}</span></p>
                        <p>Qty: <span className="font-medium text-[#ba3a3a]">{product.wastedQuantity.toLocaleString()}</span></p>
                        <p className="col-span-2">Expiry: <span className="font-medium text-[#324c44]">{product.expiryDate}</span></p>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </AdminDeliveryLayout>
  );
}

function MetricCard({ icon, label, value, tone }) {
  const toneClass = tone === 'danger' ? 'bg-[#fdecee] text-[#b03a3a]' : 'bg-[#fdf4e8] text-[#94601b]';

  return (
    <article className={`rounded-xl border border-[#e4ebe8] px-4 py-3 ${toneClass}`}>
      {icon && <span className="mb-2 inline-block opacity-80">{icon}</span>}
      <p className="mt-1 text-sm font-medium opacity-90">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </article>
  );
}

const th = 'px-4 py-3 text-left';
const td = 'px-4 py-3 text-[#425d55]';
const tdStrong = 'px-4 py-3 font-semibold text-[#1f3b32]';