import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiMoreVertical, FiPlus } from 'react-icons/fi';
import { getSupplierProducts, getSupplierDashboard } from '../../services/supplierService';
import { formatPrice } from '../../utils/priceUtils';
import RequestProductModal from '../../components/supplier/RequestProductModal';
import SupplierLayout from '../../components/supplier/SupplierLayout';

/**
 * Presentation Layer â€“ Supplier dashboard scoped by assigned brand ownership.
 */
export default function SupplierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 6;

  const loadSupplierData = async () => {
    setLoading(true);
    try {
      const [productData, dashboardRes] = await Promise.all([
        getSupplierProducts(),
        getSupplierDashboard(),
      ]);
      setProducts(productData);
      setDashboardData(dashboardRes);
      setCurrentPage(0);
    } catch {
      toast.error('Failed to load supplier dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierData();
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const totalBrands = dashboardData?.brandNames?.length || 0;
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const productsPreview = products.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleProductAction = async (product) => {
    try {
      await navigator.clipboard.writeText(String(product.id));
      toast.success(`Product ID copied: ${product.id}`);
    } catch {
      toast.success(`${product.name} (${product.id})`);
    }
  };

  return (
    <SupplierLayout
      activeKey="dashboard"
      userName={user?.name}
      onLogout={handleLogout}
      pageTitle="Supplier Dashboard"
      pageSubtitle="Manage your brands and product requests"
      breadcrumbItems={[{ label: 'Dashboard' }]}
    >
      {loading ? (
        <div className="rounded-2xl border border-[#e4ebe8] bg-white p-6 text-sm text-[#6f817b]">
          Loading dashboard...
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="Your Brands"
              value={String(totalBrands)}
              chipLabel="Active Portfolios"
              chipStyle="bg-[#eaf5ef] text-[#1c634b]"
            />
            <MetricCard
              label="Total Sales"
              value={formatPrice(dashboardData?.totalSales ?? 0)}
              chipLabel="This Month"
              chipStyle="bg-[#eaf5ef] text-[#1c634b]"
            />
            <MetricCard
              label="Pending Restocks"
              value={String(dashboardData?.pendingRestocks || 0)}
              chipLabel="Immediate Attention"
              chipStyle="bg-[#fdecee] text-[#c23939]"
            />
          </section>

          <section className="mt-6 rounded-2xl border border-[#e4ebe8] bg-white p-4 md:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-[#163a2f]">My Products</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0d4a38] px-4 text-sm font-semibold text-white transition hover:bg-[#083a2c]"
              >
                <FiPlus className="h-4 w-4" />
                <span>Request New Product</span>
              </button>
            </div>

            <RequestProductModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSuccess={() => {
                loadSupplierData();
              }}
            />

            {products.length === 0 ? (
              <p className="rounded-xl border border-[#e4ebe8] bg-[#f8fbf9] p-6 text-sm text-[#6f817b]">
                No products available for your assigned brand(s).
              </p>
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-xl border border-[#e4ebe8] md:block">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f7f9f8] text-[11px] uppercase tracking-[0.08em] text-[#667872]">
                      <tr>
                        <th className={th}>Product</th>
                        <th className={th}>Brand</th>
                        <th className={th}>Category</th>
                        <th className={th}>Price (Rs.)</th>
                        <th className={th}>Stock</th>
                        <th className={th}>Approval Status</th>
                        <th className={th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsPreview.map((product) => (
                        <tr key={product.id} className="border-t border-[#edf2f0] text-[#29453c]">
                          <td className={`${td} font-semibold`}>{product.name}</td>
                          <td className={td}>{product.brandName || '-'} </td>
                          <td className={td}>{product.category || '-'}</td>
                          <td className={td}>{formatPrice(product.price, product.unit)}</td>
                          <td className={td}>{product.stockQuantity}</td>
                          <td className={td}>
                            <ApprovalBadge status={product.approvalStatus} />
                          </td>
                          <td className={td}>
                            <button
                              type="button"
                              aria-label={`More actions for ${product.name}`}
                              onClick={() => handleProductAction(product)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#5d726b] transition hover:bg-[#f0f4f2] hover:text-[#173b31]"
                            >
                              <FiMoreVertical className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 md:hidden">
                  {productsPreview.map((product) => (
                    <article
                      key={product.id}
                      className="rounded-xl border border-[#e4ebe8] bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-bold text-[#163a2f]">{product.name}</h3>
                          <p className="mt-1 text-sm text-[#6f817b]">{product.brandName || '-'}</p>
                        </div>
                        <ApprovalBadge status={product.approvalStatus} />
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-[#325247]">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-[#6f817b]">Category</dt>
                          <dd>{product.category || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-[#6f817b]">Price</dt>
                          <dd>{formatPrice(product.price, product.unit)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-[#6f817b]">Stock</dt>
                          <dd>{product.stockQuantity}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-[#6f817b] md:text-sm">
                  <span>
                    Showing {productsPreview.length} of {products.length} products
                    {' '}({currentPage + 1}/{totalPages})
                  </span>
                  <div className="flex items-center gap-2 text-[#173b31]">
                    <button
                      type="button"
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                      className="rounded-md border border-[#dbe4e0] bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                      className="rounded-md bg-[#0d4a38] px-3 py-1.5 text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="mt-6 overflow-hidden rounded-2xl bg-linear-to-r from-[#164f3d] via-[#164f3d] to-[#102e2a] text-white">
            <div className="grid items-center gap-4 p-5 md:grid-cols-[1.2fr_1fr] md:p-7">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a6d8c3]">New Feature</p>
                <h2 className="mt-2 text-2xl font-bold leading-tight md:text-4xl">Direct-to-Consumer Analytics</h2>
                <p className="mt-3 max-w-xl text-sm text-[#cfe3d9] md:text-base">
                  Understand how urban households are consuming your produce with real-time heatmaps and demand forecasting.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/supplier/purchase-orders')}
                  className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0d4a38] transition hover:bg-[#ecf4f0]"
                >
                  Explore Insights
                </button>
              </div>
              <div className="relative h-44 overflow-hidden rounded-xl border border-white/20 bg-[radial-gradient(circle_at_20%_20%,rgba(167,212,191,0.35),transparent_55%),linear-gradient(135deg,#1f6750,#143c32)] md:h-52">
                <div className="absolute bottom-4 right-4 h-16 w-24 rounded-md border border-white/20 bg-white/10 backdrop-blur-sm" />
                <div className="absolute left-4 top-4 h-10 w-20 rounded-md border border-white/20 bg-white/10 backdrop-blur-sm" />
              </div>
            </div>
          </section>
        </>
      )}
    </SupplierLayout>
  );
}

function MetricCard({ label, value, chipLabel, chipStyle }) {
  return (
    <article className="rounded-2xl border border-[#e4ebe8] bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#6f817b]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#163a2f]">{value}</p>
      <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${chipStyle}`}>
        {chipLabel}
      </span>
    </article>
  );
}

function ApprovalBadge({ status }) {
  if (status === 'APPROVED') {
    return (
      <span className="inline-flex rounded-full bg-[#eaf5ef] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1c634b]">
        Approved
      </span>
    );
  }

  if (status === 'REJECTED') {
    return (
      <span className="inline-flex rounded-full bg-[#fdecee] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#c23939]">
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-[#f3f5f4] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#5d726b]">
      Pending
    </span>
  );
}

const th = 'px-4 py-3 text-left';
const td = 'px-4 py-3';
