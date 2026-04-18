import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiPlus, FiSearch, FiTag, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
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
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const loadSupplierData = async () => {
    setLoading(true);
    try {
      const [productData, dashboardRes] = await Promise.all([
        getSupplierProducts(),
        getSupplierDashboard(),
      ]);
      setProducts(productData);
      setDashboardData(dashboardRes);
      setPage(0);
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

  useEffect(() => { setPage(0); }, [search, filterStatus]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
    setPage(0);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.brandName || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q),
      );
    }
    if (filterStatus !== 'all') {
      result = result.filter((p) => p.approvalStatus === filterStatus);
    }
    result.sort((a, b) => {
      let av, bv;
      if (sortField === 'stock') { av = a.stockQuantity ?? 0; bv = b.stockQuantity ?? 0; return sortDir === 'asc' ? av - bv : bv - av; }
      if (sortField === 'price') { av = a.price ?? 0; bv = b.price ?? 0; return sortDir === 'asc' ? av - bv : bv - av; }
      av = sortField === 'brand' ? (a.brandName || '') : sortField === 'category' ? (a.category || '') : (a.name || '');
      bv = sortField === 'brand' ? (b.brandName || '') : sortField === 'category' ? (b.category || '') : (b.name || '');
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [products, search, filterStatus, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paged = filteredProducts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <MetricCard
              label="Your Brands"
              value={String(totalBrands)}
              chipLabel="Active Portfolios"
              chipStyle="bg-[#eaf5ef] text-[#1c634b]"
              icon={FiTag}
            />
            <MetricCard
              label="Total Sales"
              value={formatPrice(dashboardData?.totalSales ?? 0)}
              chipLabel="This Month"
              chipStyle="bg-[#eaf5ef] text-[#1c634b]"
              icon={FiTrendingUp}
            />
            <MetricCard
              label="Pending Restocks"
              value={String(dashboardData?.pendingRestocks || 0)}
              chipLabel="Immediate Attention"
              chipStyle="bg-[#fdecee] text-[#c23939]"
              icon={FiAlertCircle}
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

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-48 flex-1">
                <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8fa89f]" />
                <input
                  type="search"
                  placeholder="Search by name, brand or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-xl border border-[#dce8e3] bg-[#f4f7f6] pl-9 pr-3 text-sm text-[#5f7770] focus:outline-none"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 rounded-xl border border-[#dce8e3] bg-[#f4f7f6] px-3 text-sm text-[#5f7770] focus:outline-none"
              >
                <option value="all">All statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <span className="text-xs text-[#6f817b]">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</span>
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
            ) : filteredProducts.length === 0 ? (
              <p className="rounded-xl border border-[#e4ebe8] bg-[#f8fbf9] p-6 text-sm text-[#6f817b]">
                No products match your search or filter.
              </p>
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-xl border border-[#e4ebe8] md:block">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f7f9f8] text-[11px] uppercase tracking-[0.08em] text-[#667872]">
                      <tr>
                        <SortableHeader label="Product" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} className={th} />
                        <SortableHeader label="Brand" field="brand" sortField={sortField} sortDir={sortDir} onSort={handleSort} className={th} />
                        <SortableHeader label="Category" field="category" sortField={sortField} sortDir={sortDir} onSort={handleSort} className={th} />
                        <SortableHeader label="Price (Rs.)" field="price" sortField={sortField} sortDir={sortDir} onSort={handleSort} className={th} />
                        <SortableHeader label="Stock" field="stock" sortField={sortField} sortDir={sortDir} onSort={handleSort} className={th} />
                        <th className={th}>Approval Status</th>

                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((product) => (
                        <tr key={product.id} className="border-t border-[#edf2f0] text-[#29453c]">
                          <td className={`${td} font-semibold`}>{product.name}</td>
                          <td className={td}>{product.brandName || '-'} </td>
                          <td className={td}>{product.category || '-'}</td>
                          <td className={td}>{formatPrice(product.price, product.unit)}</td>
                          <td className={td}>
                            <span className={product.reorderThreshold != null && product.stockQuantity <= product.reorderThreshold ? 'font-semibold text-red-600' : ''}>
                              {product.stockQuantity}
                            </span>
                            {product.reorderThreshold != null && product.stockQuantity <= product.reorderThreshold && (
                              <span className="ml-2 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Low Stock</span>
                            )}
                          </td>
                          <td className={td}>
                            <ApprovalBadge status={product.approvalStatus} />
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 md:hidden">
                  {paged.map((product) => (
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
                          <dd className="flex items-center gap-2">
                            <span className={product.reorderThreshold != null && product.stockQuantity <= product.reorderThreshold ? 'font-semibold text-red-600' : ''}>
                              {product.stockQuantity}
                            </span>
                            {product.reorderThreshold != null && product.stockQuantity <= product.reorderThreshold && (
                              <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Low Stock</span>
                            )}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#edf2f0] pt-4">
                  <span className="text-xs text-[#6f817b]">
                    Page {page + 1} of {totalPages} &middot; {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                  </span>
                  <div className="flex gap-2">
                    <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded-lg border border-[#dce8e3] bg-white px-3 py-1.5 text-xs font-medium text-[#5f7770] disabled:opacity-40">Prev</button>
                    <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} className="rounded-lg bg-[#0d4a38] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40">Next</button>
                  </div>
                </div>
              </>
            )}
          </section>

        </>
      )}
    </SupplierLayout>
  );
}

function SortableHeader({ label, field, sortField, sortDir, onSort, className }) {
  const active = sortField === field;
  return (
    <th className={className}>
      <button onClick={() => onSort(field)} className="inline-flex items-center gap-1 font-semibold hover:text-[#0d4a38]">
        {label}
        <span className="flex flex-col text-[8px] leading-none">
          <span className={active && sortDir === 'asc' ? 'text-[#0d4a38]' : 'opacity-40'}>▲</span>
          <span className={active && sortDir === 'desc' ? 'text-[#0d4a38]' : 'opacity-40'}>▼</span>
        </span>
      </button>
    </th>
  );
}

function MetricCard({ label, value, chipLabel, chipStyle, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-[#e4ebe8] bg-white p-5">
      {Icon && <Icon className="mb-2 h-5 w-5 text-[#6f817b]" />}
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
