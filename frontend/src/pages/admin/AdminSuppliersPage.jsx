import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  createSupplier,
  getActiveBrands,
  getSuppliers,
  updateSupplier,
  updateSupplierStatus,
} from '../../services/adminSupplierService';
import CreateSupplierModal from '../../components/admin/CreateSupplierModal';
import AdminDeliveryLayout from '../../components/admin/delivery/AdminDeliveryLayout';

/**
 * Presentation Layer – Admin supplier management page.
 */
export default function AdminSuppliersPage() {
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
    <AdminDeliveryLayout
      title="Suppliers"
      description="Manage supplier entities, account status, and associated brand partnerships."
      breadcrumbCurrent="Manage Suppliers"
      breadcrumbItems={[
        { label: 'Admin', to: '/admin' },
        { label: 'Manage Suppliers' },
      ]}
      actions={
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-xl bg-[#0d4a38] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#083a2c]"
        >
          + Create Supplier
        </button>
      }
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e4ebe8] bg-[#f4f7f6] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[#6f817b]">Total Suppliers</p>
          <p className="mt-1 text-2xl font-bold text-[#153a30]">{suppliers.length}</p>
        </div>
        <div className="rounded-xl border border-[#e4ebe8] bg-[#eaf5ef] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[#0d4a38]">Active Suppliers</p>
          <p className="mt-1 text-2xl font-bold text-[#0d4a38]">
            {suppliers.filter((supplier) => supplier.isActive).length}
          </p>
        </div>
        <div className="rounded-xl border border-[#e4ebe8] bg-[#dff4e8] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[#0d4a38]">Active Brands Available</p>
          <p className="mt-1 text-2xl font-bold text-[#0d4a38]">{brands.length}</p>
        </div>
      </section>

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

      <section className="overflow-hidden rounded-2xl border border-[#e4ebe8] bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-[#6f817b]">Loading supplier accounts...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-10 text-center text-[#6f817b]">No suppliers found. Create one to get started.</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-[#f5f8f7] text-xs uppercase tracking-wide text-[#7a8a85]">
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
                    <tr key={supplier.id} className="border-t border-[#edf2f0]">
                      <td className="px-4 py-3 font-semibold text-[#1f3b32]">{supplier.name}</td>
                      <td className="px-4 py-3 text-[#425d55]">{supplier.email}</td>
                      <td className="px-4 py-3 text-[#425d55]">
                        {supplier.brands?.length
                          ? supplier.brands.map((brand) => brand.name).join(', ')
                          : 'No brands assigned'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            supplier.isActive ? 'bg-[#c8f0da] text-[#1f6a4d]' : 'bg-[#e8efec] text-[#526b64]'
                          }`}
                        >
                          {supplier.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditModal(supplier)}
                            className="text-xs font-semibold text-[#526b64] hover:text-[#0d4a38]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(supplier)}
                            className={`text-xs font-semibold ${
                              supplier.isActive ? 'text-[#ba3a3a] hover:text-[#a22f2f]' : 'text-[#0d4a38] hover:text-[#083a2c]'
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

            <div className="space-y-3 p-4 md:hidden">
              {suppliers.map((supplier) => (
                <article key={supplier.id} className="rounded-xl border border-[#edf2ef] bg-[#fbfdfc] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1f3b32]">{supplier.name}</p>
                      <p className="mt-1 text-xs text-[#6f817b]">{supplier.email}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        supplier.isActive ? 'bg-[#c8f0da] text-[#1f6a4d]' : 'bg-[#e8efec] text-[#526b64]'
                      }`}
                    >
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-[#526b64]">
                    Brands: {supplier.brands?.length
                      ? supplier.brands.map((brand) => brand.name).join(', ')
                      : 'No brands assigned'}
                  </p>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => openEditModal(supplier)}
                      className="text-xs font-semibold text-[#526b64] hover:text-[#0d4a38]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(supplier)}
                      className={`text-xs font-semibold ${
                        supplier.isActive ? 'text-[#ba3a3a] hover:text-[#a22f2f]' : 'text-[#0d4a38] hover:text-[#083a2c]'
                      }`}
                    >
                      {supplier.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </AdminDeliveryLayout>
  );
}
