import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiUsers, FiUserCheck, FiTag, FiSearch } from 'react-icons/fi';
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

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [search, filterStatus]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(0);
  };

  const filtered = useMemo(() => {
    let result = [...suppliers];
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.brands?.some((b) => b.name?.toLowerCase().includes(q)),
      );
    }
    if (filterStatus === 'active') result = result.filter((s) => s.isActive);
    if (filterStatus === 'inactive') result = result.filter((s) => !s.isActive);
    result.sort((a, b) => {
      let av = '';
      let bv = '';
      if (sortField === 'name') { av = a.name || ''; bv = b.name || ''; }
      else if (sortField === 'email') { av = a.email || ''; bv = b.email || ''; }
      else if (sortField === 'status') { av = a.isActive ? 'active' : 'inactive'; bv = b.isActive ? 'active' : 'inactive'; }
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [suppliers, search, filterStatus, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e4ebe8] bg-[#f4f7f6] px-4 py-3">
          <FiUsers className="mb-2 h-5 w-5 text-[#6f817b]" />
          <p className="text-xs uppercase tracking-wide text-[#6f817b]">Total Suppliers</p>
          <p className="mt-1 text-2xl font-bold text-[#153a30]">{suppliers.length}</p>
        </div>
        <div className="rounded-xl border border-[#e4ebe8] bg-[#eaf5ef] px-4 py-3">
          <FiUserCheck className="mb-2 h-5 w-5 text-[#0d4a38]" />
          <p className="text-xs uppercase tracking-wide text-[#0d4a38]">Active Suppliers</p>
          <p className="mt-1 text-2xl font-bold text-[#0d4a38]">
            {suppliers.filter((supplier) => supplier.isActive).length}
          </p>
        </div>
        <div className="rounded-xl border border-[#e4ebe8] bg-[#dff4e8] px-4 py-3">
          <FiTag className="mb-2 h-5 w-5 text-[#0d4a38]" />
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

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-45 flex-1">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8fa89f]" />
          <input
            type="search"
            placeholder="Search by name, email or brand..."
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
          <option value="all">All Statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        {!loading && (
          <span className="text-xs text-[#6f817b]">{filtered.length} supplier{filtered.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e4ebe8] bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-[#6f817b]">Loading supplier accounts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-[#6f817b]">
            {suppliers.length === 0 ? 'No suppliers found. Create one to get started.' : 'No suppliers match your search or filter.'}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-[#f5f8f7] text-xs uppercase tracking-wide text-[#7a8a85]">
                  <tr>
                    <SortableHeader label="Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Email" field="email" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="px-4 py-3 text-left">Brands</th>
                    <SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((supplier) => (
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
              {paged.map((supplier) => (
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#edf2f0] px-4 py-3">
                <span className="text-xs text-[#6f817b]">
                  Page {page + 1} of {totalPages} &middot; {filtered.length} supplier{filtered.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded-lg border border-[#dce8e3] bg-white px-3 py-1.5 text-xs font-medium text-[#5f7770] disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="rounded-lg border border-[#dce8e3] bg-white px-3 py-1.5 text-xs font-medium text-[#5f7770] disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </AdminDeliveryLayout>
  );
}

function SortableHeader({ label, field, sortField, sortDir, onSort, className = '' }) {
  const active = sortField === field;
  return (
    <th className={`cursor-pointer select-none px-4 py-3 text-left ${className}`} onClick={() => onSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="inline-flex flex-col leading-none text-[#aabdb6]">
          <svg className={`h-2.5 w-2.5 ${active && sortDir === 'asc' ? 'text-[#0d4a38]' : ''}`} viewBox="0 0 10 6" fill="currentColor" aria-hidden="true"><path d="M5 0L0 6h10z" /></svg>
          <svg className={`h-2.5 w-2.5 ${active && sortDir === 'desc' ? 'text-[#0d4a38]' : ''}`} viewBox="0 0 10 6" fill="currentColor" aria-hidden="true"><path d="M5 6L0 0h10z" /></svg>
        </span>
      </span>
    </th>
  );
}
