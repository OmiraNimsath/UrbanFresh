import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  createSupplier,
  getActiveBrands,
  getSuppliers,
  updateSupplier,
  updateSupplierStatus,
} from '../../services/adminSupplierService';
import CreateSupplierModal from '../../components/admin/CreateSupplierModal';

/**
 * Presentation Layer – Admin supplier management page.
 */
export default function AdminSuppliersPage() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [supplierData, brandData] = await Promise.all([
        getSuppliers(),
        getActiveBrands(),
      ]);
      setSuppliers(supplierData);
      setBrands(brandData);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load supplier management data';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (payload) => {
    setIsSubmitting(true);
    setModalError('');
    try {
      await createSupplier(payload);
      toast.success('Supplier account created successfully');
      setShowCreateModal(false);
      setEditingSupplier(null);
      await loadData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create supplier account';
      if (error.response?.status === 409) {
        setModalError(message);
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSupplier = async (payload) => {
    if (!editingSupplier) {
      return;
    }

    setIsSubmitting(true);
    setModalError('');
    try {
      await updateSupplier(editingSupplier.id, payload);
      toast.success('Supplier updated successfully');
      setShowCreateModal(false);
      setEditingSupplier(null);
      await loadData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update supplier';
      if (error.response?.status === 409) {
        setModalError(message);
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingSupplier(null);
    setModalError('');
    setShowCreateModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setModalError('');
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingSupplier(null);
    setModalError('');
  };

  const handleToggleStatus = async (supplier) => {
    try {
      const nextStatus = !supplier.isActive;
      await updateSupplierStatus(supplier.id, nextStatus);
      toast.success(`Supplier ${nextStatus ? 'activated' : 'deactivated'} successfully`);
      await loadData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update supplier status';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => navigate('/admin')}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-green-700"
        >
          <span aria-hidden="true">&larr;</span>
          <span>Back to Dashboard</span>
        </button>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-green-600">Admin Panel</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">Supplier Management</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Create supplier accounts, keep profiles updated, and control brand ownership with clear validation.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              + Create Supplier
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-100 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Suppliers</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{suppliers.length}</p>
            </div>
            <div className="rounded-xl bg-green-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-green-700">Active Suppliers</p>
              <p className="mt-1 text-2xl font-bold text-green-700">
                {suppliers.filter((supplier) => supplier.isActive).length}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-blue-700">Active Brands Available</p>
              <p className="mt-1 text-2xl font-bold text-blue-700">{brands.length}</p>
            </div>
          </div>
        </div>

        {showCreateModal && (
          <CreateSupplierModal
            brands={brands}
            initialSupplier={editingSupplier}
            apiError={modalError}
            onClose={closeModal}
            onSubmit={editingSupplier ? handleUpdateSupplier : handleCreateSupplier}
            isSubmitting={isSubmitting}
          />
        )}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading supplier accounts...</div>
          ) : suppliers.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No suppliers found. Create one to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Brands</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-medium text-slate-900">{supplier.name}</td>
                      <td className="px-4 py-3 text-slate-700">{supplier.email}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {supplier.brands?.length
                          ? supplier.brands.map((brand) => brand.name).join(', ')
                          : 'No brands assigned'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            supplier.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {supplier.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditModal(supplier)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(supplier)}
                            className={`text-xs font-semibold ${
                              supplier.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                            }`}
                          >
                            {supplier.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
