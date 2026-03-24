import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  createSupplier,
  getActiveBrands,
  getSuppliers,
  updateSupplierStatus,
} from '../../services/adminSupplierService';
import CreateSupplierModal from '../../components/admin/CreateSupplierModal';

/**
 * Presentation Layer – Admin supplier management page.
 */
export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    try {
      await createSupplier(payload);
      toast.success('Supplier account created successfully');
      setShowCreateModal(false);
      await loadData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create supplier account';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supplier Management</h1>
            <p className="text-sm text-gray-600 mt-1">Create supplier accounts and assign brand ownership</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700"
          >
            + Create Supplier
          </button>
        </div>

        {showCreateModal && (
          <CreateSupplierModal
            brands={brands}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateSupplier}
            isSubmitting={isSubmitting}
          />
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Loading supplier accounts...</div>
          ) : suppliers.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No suppliers found. Create one to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide text-xs">
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
                    <tr key={supplier.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-900">{supplier.name}</td>
                      <td className="px-4 py-3 text-gray-700">{supplier.email}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {supplier.brands?.length
                          ? supplier.brands.map((brand) => brand.name).join(', ')
                          : 'No brands assigned'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            supplier.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {supplier.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(supplier)}
                          className={`px-3 py-1.5 text-xs rounded-md text-white ${
                            supplier.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {supplier.isActive ? 'Deactivate' : 'Activate'}
                        </button>
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
