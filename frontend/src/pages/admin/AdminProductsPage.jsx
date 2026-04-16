import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  toggleHideProduct,
  getPendingProducts,
  approveProduct,
  rejectProduct
} from '../../services/adminProductService';
import { getActiveBrands } from '../../services/adminBrandService';
import ProductFormModal from '../../components/admin/ProductFormModal';
import { formatPrice } from '../../utils/priceUtils';

/**
 * Presentation Layer – Admin product management page.
 * Displays a paginated table of all products with add, edit, and delete actions.
 * Displays a second tab for new listing requests from suppliers.
 */
export default function AdminProductsPage() {
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState('catalog');

  // Table state
  const [pageData, setPageData] = useState(null);
  const [pendingData, setPendingData] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [currentPendingPage, setCurrentPendingPage] = useState(0);
  
  const [loadingTable, setLoadingTable] = useState(false);
  const [tableError, setTableError] = useState(null);
  const [brands, setBrands] = useState([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  // Status/Hide state
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
        >
          + Add Product
        </button>
      </div>

      {tableError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4 mb-4">
          {tableError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-2 outline-none font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'catalog' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Product Management
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2 flex items-center gap-2 outline-none font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'pending' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          New Listing Requests
          {pendingData?.totalElements > 0 && (
            <span className="bg-yellow-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {pendingData.totalElements}
            </span>
          )}
        </button>
      </div>

      {loadingTable && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Catalog */}
      {!loadingTable && activeTab === 'catalog' && pageData && (
        <>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
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
                    <td colSpan={8} className="py-10 text-center text-gray-400">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  pageData.content?.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className={td}><span className="font-medium text-gray-800">{p.name}</span></td>
                      <td className={td}>{p.category ?? '—'}</td>
                      <td className={td}>{p.brandName ?? '—'}</td>
                      <td className={td}>{formatPrice(p.price, p.unit)}</td>    
                      <td className={td}>
                        <span className={p.stockQuantity === 0 ? 'text-red-500 font-medium' : 'text-gray-700'}>
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td className={td}>
                        {p.approvalStatus === 'APPROVED' ? (
                          <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Approved</span>
                        ) : p.approvalStatus === 'PENDING' ? (
                          <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full">Pending</span>
                        ) : p.approvalStatus === 'REJECTED' ? (
                          <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">Rejected</span>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className={td}>{p.earliestExpiryDate ?? p.expiryDate ?? '—'}</td>
                      <td className={td}>
                        <div className="flex gap-3">
                          <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline font-medium text-xs">Edit</button>
                          <button onClick={() => handleToggleHide(p)} disabled={hidingId === p.id} className={`font-medium text-xs disabled:opacity-50 hover:underline ${p.hidden ? 'text-green-600' : 'text-gray-500'}`}>
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
          {pageData.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>Page {pageData.number + 1} of {pageData.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage((p) => p - 1)} disabled={pageData.first} className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100">Prev</button>
                <button onClick={() => setCurrentPage((p) => p + 1)} disabled={pageData.last} className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pending Listing Requests */}
      {!loadingTable && activeTab === 'pending' && pendingData && (
        <>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
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
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                      No new listing requests at this time.
                    </td>
                  </tr>
                ) : (
                  pendingData.content?.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className={td}><span className="font-medium text-gray-800">{p.name}</span></td>
                      <td className={td}>{p.category ?? '—'}</td>
                      <td className={td}>{p.brandName ?? '—'}</td>
                      <td className={td}>{formatPrice(p.price, p.unit)}</td>    
                      <td className={td}>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="prod" className="w-10 h-10 object-cover rounded border border-gray-200 shadow-sm" />
                        ) : '—'}
                      </td>
                      <td className={td}>
                        <div className="flex gap-2 items-center">
                          <button onClick={() => handleApprove(p.id)} disabled={processingId === p.id} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded font-semibold disabled:opacity-50 transition-colors">
                            Approve
                          </button>
                          <button onClick={() => handleReject(p.id)} disabled={processingId === p.id} className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded font-semibold disabled:opacity-50 transition-colors">
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
          {pendingData.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>Page {pendingData.number + 1} of {pendingData.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPendingPage((p) => p - 1)} disabled={pendingData.first} className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100">Prev</button>
                <button onClick={() => setCurrentPendingPage((p) => p + 1)} disabled={pendingData.last} className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100">Next</button>
              </div>
            </div>
          )}
        </>
      )}

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