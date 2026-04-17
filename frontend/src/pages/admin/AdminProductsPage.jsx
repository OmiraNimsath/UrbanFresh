import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  toggleHideProduct,
  getPendingProducts,
  approveProduct,
  rejectProduct,
} from '../../services/adminProductService';
import { getActiveBrands } from '../../services/adminBrandService';
import ProductFormModal from '../../components/admin/ProductFormModal';
import AdminDeliveryLayout from '../../components/admin/delivery/AdminDeliveryLayout';
import { formatPrice } from '../../utils/priceUtils';

/**
 * Presentation Layer – Admin product management page.
 * Displays a paginated table of all products with add, edit, and delete actions.
 * Displays a second tab for new listing requests from suppliers.
 */
export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState('catalog');

  const [pageData, setPageData] = useState(null);
  const [pendingData, setPendingData] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentPendingPage, setCurrentPendingPage] = useState(0);
  const [loadingTable, setLoadingTable] = useState(false);
  const [tableError, setTableError] = useState(null);
  const [brands, setBrands] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const [hidingId, setHidingId] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchPage = useCallback(async () => {
    setLoadingTable(true);
    setTableError(null);
    try {
      const [data, pData, activeBrands] = await Promise.all([
        getAdminProducts(currentPage, 20),
        getPendingProducts(currentPendingPage, 20),
        getActiveBrands(),
      ]);
      setPageData(data);
      setPendingData(pData);
      setBrands(activeBrands);
    } catch {
      setTableError('Failed to load products. Please try again.');
    } finally {
      setLoadingTable(false);
    }
  }, [currentPage, currentPendingPage]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const openCreate = () => {
    setEditProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditProduct(null);
  };

  const handleSubmit = async (formData) => {
    setSaving(true);
    try {
      if (editProduct) {
        await updateProduct(editProduct.id, formData);
        toast.success('Product updated successfully');
      } else {
        await createProduct(formData);
        toast.success('Product created successfully');
      }
      closeModal();
      fetchPage();
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to save product';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHide = async (product) => {
    setHidingId(product.id);
    try {
      const updated = await toggleHideProduct(product.id);
      toast.success(updated.hidden ? 'Product hidden from store' : 'Product visible in store');
      setPageData((prev) =>
        prev
          ? { ...prev, content: prev.content.map((p) => (p.id === updated.id ? updated : p)) }
          : prev
      );
    } catch {
      toast.error('Failed to update product visibility');
    } finally {
      setHidingId(null);
    }
  };

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await approveProduct(id);
      toast.success('Product approved! Stock set to 0. It remains hidden until stock is updated.');
      fetchPage();
    } catch {
      toast.error('Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      await rejectProduct(id);
      toast.success('Product rejected.');
      fetchPage();
    } catch {
      toast.error('Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const pageSummary = pageData?.content || [];
  const hiddenCount = pageSummary.filter((item) => item.hidden).length;
  const visibleCount = pageSummary.length - hiddenCount;

  return (
    <AdminDeliveryLayout
      title="Product Management"
      description="Catalog operations, supplier listing review, and visibility controls."
      breadcrumbCurrent="Products"
      actions={
        <button
          onClick={openCreate}
          className="inline-flex items-center rounded-lg bg-[#0d4a38] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#083a2c]"
        >
          + Add Product
        </button>
      }
    >
      {tableError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{tableError}</div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Loaded Products" value={pageData?.totalElements ?? 0} tone="default" />
        <SummaryCard label="Visible in Store" value={visibleCount} tone="green" />
        <SummaryCard label="Hidden from Store" value={hiddenCount} tone="slate" />
      </section>

      <section className="rounded-2xl border border-[#e4ebe8] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#eef2f0] pb-4">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'catalog'
                ? 'bg-[#eaf5ef] text-[#0d4a38]'
                : 'bg-white text-slate-500 hover:text-slate-700'
            }`}
          >
            Product Management
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'pending'
                ? 'bg-[#eaf5ef] text-[#0d4a38]'
                : 'bg-white text-slate-500 hover:text-slate-700'
            }`}
          >
            New Listing Requests
            {pendingData?.totalElements > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                {pendingData.totalElements}
              </span>
            )}
          </button>
        </div>

        {loadingTable && (
          <div className="mt-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        )}

        {!loadingTable && activeTab === 'catalog' && pageData && (
          <>
            <div className="mt-4 hidden overflow-x-auto rounded-xl border border-[#edf2ef] md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={th}>Name</th>
                    <th className={th}>Category</th>
                    <th className={th}>Brand</th>
                    <th className={th}>Price</th>
                    <th className={th}>Stock</th>
                    <th className={th}>Status</th>
                    <th className={th}>Expiry</th>
                    <th className={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.content?.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    pageData.content?.map((p) => (
                      <tr key={p.id} className="border-t border-[#edf2ef]">
                        <td className={td}><span className="font-medium text-slate-900">{p.name}</span></td>
                        <td className={td}>{p.category ?? '—'}</td>
                        <td className={td}>{p.brandName ?? '—'}</td>
                        <td className={td}>{formatPrice(p.price, p.unit)}</td>
                        <td className={td}>
                          <span className={p.stockQuantity === 0 ? 'font-medium text-red-600' : 'text-slate-700'}>
                            {p.stockQuantity}
                          </span>
                        </td>
                        <td className={td}>
                          {p.approvalStatus === 'APPROVED' ? (
                            <StatusChip text="Approved" tone="green" />
                          ) : p.approvalStatus === 'PENDING' ? (
                            <StatusChip text="Pending" tone="amber" />
                          ) : p.approvalStatus === 'REJECTED' ? (
                            <StatusChip text="Rejected" tone="red" />
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </td>
                        <td className={td}>{p.earliestExpiryDate ?? p.expiryDate ?? '—'}</td>
                        <td className={td}>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openEdit(p)}
                              className="text-xs font-semibold text-[#0d4a38] hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleHide(p)}
                              disabled={hidingId === p.id}
                              className={`text-xs font-semibold hover:underline disabled:opacity-50 ${
                                p.hidden ? 'text-[#0d4a38]' : 'text-slate-500'
                              }`}
                            >
                              {hidingId === p.id ? '...' : p.hidden ? 'Show' : 'Hide'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-3 md:hidden">
              {pageData.content?.length === 0 ? (
                <div className="rounded-xl border border-[#edf2ef] p-6 text-center text-sm text-slate-500">
                  No products found.
                </div>
              ) : (
                pageData.content?.map((p) => (
                  <article key={p.id} className="rounded-xl border border-[#edf2ef] bg-[#fbfdfc] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{p.category ?? 'No category'} · {p.brandName ?? 'No brand'}</p>
                      </div>
                      {p.approvalStatus === 'APPROVED' ? (
                        <StatusChip text="Approved" tone="green" />
                      ) : p.approvalStatus === 'PENDING' ? (
                        <StatusChip text="Pending" tone="amber" />
                      ) : (
                        <StatusChip text={p.approvalStatus || 'N/A'} tone="red" />
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600">
                      <p>Price: <span className="font-medium text-slate-800">{formatPrice(p.price, p.unit)}</span></p>
                      <p>Stock: <span className={p.stockQuantity === 0 ? 'font-medium text-red-600' : 'font-medium text-slate-800'}>{p.stockQuantity}</span></p>
                      <p className="col-span-2">Expiry: <span className="font-medium text-slate-800">{p.earliestExpiryDate ?? p.expiryDate ?? '—'}</span></p>
                    </div>
                    <div className="mt-3 flex gap-3">
                      <button onClick={() => openEdit(p)} className="text-xs font-semibold text-[#0d4a38] hover:underline">Edit</button>
                      <button
                        onClick={() => handleToggleHide(p)}
                        disabled={hidingId === p.id}
                        className={`text-xs font-semibold hover:underline disabled:opacity-50 ${p.hidden ? 'text-[#0d4a38]' : 'text-slate-500'}`}
                      >
                        {hidingId === p.id ? '...' : p.hidden ? 'Show' : 'Hide'}
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            <Pagination
              pageData={pageData}
              onPrev={() => setCurrentPage((p) => p - 1)}
              onNext={() => setCurrentPage((p) => p + 1)}
            />
          </>
        )}

        {!loadingTable && activeTab === 'pending' && pendingData && (
          <>
            <div className="mt-4 hidden overflow-x-auto rounded-xl border border-[#edf2ef] md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={th}>Name</th>
                    <th className={th}>Category</th>
                    <th className={th}>Brand</th>
                    <th className={th}>Price</th>
                    <th className={th}>Image</th>
                    <th className={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingData.content?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        No new listing requests at this time.
                      </td>
                    </tr>
                  ) : (
                    pendingData.content?.map((p) => (
                      <tr key={p.id} className="border-t border-[#edf2ef]">
                        <td className={td}><span className="font-medium text-slate-900">{p.name}</span></td>
                        <td className={td}>{p.category ?? '—'}</td>
                        <td className={td}>{p.brandName ?? '—'}</td>
                        <td className={td}>{formatPrice(p.price, p.unit)}</td>
                        <td className={td}>
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={`${p.name} preview`} className="h-10 w-10 rounded-md border border-[#e4ebe8] object-cover" />
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className={td}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(p.id)}
                              disabled={processingId === p.id}
                              className="rounded bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-200 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(p.id)}
                              disabled={processingId === p.id}
                              className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-3 md:hidden">
              {pendingData.content?.length === 0 ? (
                <div className="rounded-xl border border-[#edf2ef] p-6 text-center text-sm text-slate-500">
                  No new listing requests at this time.
                </div>
              ) : (
                pendingData.content?.map((p) => (
                  <article key={p.id} className="rounded-xl border border-[#edf2ef] bg-[#fbfdfc] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{p.category ?? 'No category'} · {p.brandName ?? 'No brand'}</p>
                      </div>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={`${p.name} preview`} className="h-10 w-10 rounded-md border border-[#e4ebe8] object-cover" />
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs text-slate-600">Price: <span className="font-medium text-slate-800">{formatPrice(p.price, p.unit)}</span></p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(p.id)}
                        disabled={processingId === p.id}
                        className="rounded bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-200 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(p.id)}
                        disabled={processingId === p.id}
                        className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            <Pagination
              pageData={pendingData}
              onPrev={() => setCurrentPendingPage((p) => p - 1)}
              onNext={() => setCurrentPendingPage((p) => p + 1)}
            />
          </>
        )}
      </section>

      {modalOpen && (
        <ProductFormModal
          key={editProduct?.id ?? 'new-product'}
          product={editProduct}
          brands={brands}
          onSubmit={handleSubmit}
          onClose={closeModal}
          loading={saving}
        />
      )}
    </AdminDeliveryLayout>
  );
}

function SummaryCard({ label, value, tone }) {
  const toneClass =
    tone === 'green'
      ? 'bg-[#eaf5ef] text-[#0d4a38]'
      : tone === 'slate'
        ? 'bg-slate-100 text-slate-700'
        : 'bg-white text-slate-900';

  return (
    <article className={`rounded-xl border border-[#e4ebe8] px-4 py-3 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </article>
  );
}

function StatusChip({ text, tone }) {
  const toneClass =
    tone === 'green'
      ? 'bg-green-100 text-green-700'
      : tone === 'amber'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700';

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${toneClass}`}>{text}</span>;
}

function Pagination({ pageData, onPrev, onNext }) {
  if (!pageData || pageData.totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
      <span>
        Page {pageData.number + 1} of {pageData.totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={pageData.first}
          className="rounded-lg border border-[#d4dfdb] px-3 py-1.5 text-sm transition hover:bg-slate-50 disabled:opacity-40"
        >
          Prev
        </button>
        <button
          onClick={onNext}
          disabled={pageData.last}
          className="rounded-lg border border-[#d4dfdb] px-3 py-1.5 text-sm transition hover:bg-slate-50 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
const td = 'px-4 py-3 text-slate-700';
