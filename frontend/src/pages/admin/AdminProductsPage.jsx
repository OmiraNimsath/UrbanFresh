import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../services/adminProductService';
import { getActiveBrands } from '../../services/adminBrandService';
import ProductFormModal from '../../components/admin/ProductFormModal';
import { formatPrice } from '../../utils/priceUtils';

/**
 * Presentation Layer – Admin product management page.
 * Displays a paginated table of all products with add, edit, and delete actions.
 * All mutations show a toast and refresh the table on success.
 */
export default function AdminProductsPage() {
  const navigate = useNavigate();

  // ── Table state ──────────────────────────────────────────────────────────────
  const [pageData, setPageData] = useState(null);   // Spring Page<AdminProductResponse>
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingTable, setLoadingTable] = useState(false);
  const [tableError, setTableError] = useState(null);
  const [brands, setBrands] = useState([]);

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null); // null = create mode
  const [saving, setSaving] = useState(false);

  // ── Delete confirmation state ────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState(null);

  // ── Fetch page ───────────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (page) => {
    setLoadingTable(true);
    setTableError(null);
    try {
      const [data, activeBrands] = await Promise.all([
        getAdminProducts(page, 20),
        getActiveBrands(),
      ]);
      setPageData(data);
      setBrands(activeBrands);
    } catch {
      setTableError('Failed to load products. Please try again.');
    } finally {
      setLoadingTable(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(currentPage);
  }, [currentPage, fetchPage]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

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
      fetchPage(currentPage);
    } catch (err) {
      // Surface validation errors from the backend if present
      const msg = err.response?.data?.message ?? 'Failed to save product';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      // If we deleted the last item on a page > 0, go back one page
      const isLastOnPage = pageData?.content?.length === 1 && currentPage > 0;
      fetchPage(isLastOnPage ? currentPage - 1 : currentPage);
      if (isLastOnPage) setCurrentPage((p) => p - 1);
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/admin')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-1 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
        >
          + Add Product
        </button>
      </div>

      {/* Error state */}
      {tableError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4 mb-4">
          {tableError}
        </div>
      )}

      {/* Loading skeleton */}
      {loadingTable && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Table */}
      {!loadingTable && pageData && (
        <>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Category</th>
                  <th className={th}>Brand</th>
                  <th className={th}>Price</th>
                  <th className={th}>Unit</th>
                  <th className={th}>Stock</th>
                  <th className={th}>Featured</th>
                  <th className={th}>Expiry</th>
                  <th className={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.content?.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-gray-400">
                      No products found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  pageData.content?.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className={td}>
                        <span className="font-medium text-gray-800">{p.name}</span>
                      </td>
                      <td className={td}>{p.category ?? '—'}</td>
                      <td className={td}>{p.brandName ?? '—'}</td>
                      <td className={td}>{formatPrice(p.price, p.unit)}</td>
                      <td className={td}>{UNIT_DISPLAY[p.unit] ?? p.unit ?? '—'}</td>
                      <td className={td}>
                        <span
                          className={
                            p.stockQuantity === 0
                              ? 'text-red-500 font-medium'
                              : 'text-gray-700'
                          }
                        >
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td className={td}>
                        {p.featured ? (
                          <span className="text-green-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className={td}>{p.expiryDate ?? '—'}</td>
                      <td className={td}>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="text-blue-600 hover:underline text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                            className="text-red-500 hover:underline text-xs font-medium disabled:opacity-50"
                          >
                            {deletingId === p.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pageData.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>
                Page {pageData.number + 1} of {pageData.totalPages} —{' '}
                {pageData.totalElements} products total
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={pageData.first}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={pageData.last}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <ProductFormModal
          product={editProduct}
          brands={brands}
          onSubmit={handleSubmit}
          onClose={closeModal}
          loading={saving}
        />
      )}
    </div>
  );
}

const th = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide';
const td = 'px-4 py-3 text-gray-700';

const UNIT_DISPLAY = {
  PER_ITEM: 'per item',
  PER_KG:   'per kg',
  PER_G:    'per g',
  PER_L:    'per L',
  PER_ML:   'per ml',
};
