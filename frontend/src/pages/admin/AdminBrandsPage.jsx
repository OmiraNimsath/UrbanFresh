import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiTag, FiCheckCircle, FiTrendingUp, FiSearch } from 'react-icons/fi';
import {
  createBrand,
  deleteBrand,
  getAllBrands,
  updateBrand,
} from '../../services/adminBrandService';
import AdminDeliveryLayout from '../../components/admin/delivery/AdminDeliveryLayout';

/**
 * Presentation Layer – Admin brand management page.
 */
export default function AdminBrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [serverError, setServerError] = useState('');

  const [form, setForm] = useState({ name: '', code: '' });
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const isEditMode = Boolean(editingBrand);

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [search, filterStatus]);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const data = await getAllBrands();
      setBrands(data);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load brands';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = useMemo(
    () => brands.filter((brand) => brand.active).length,
    [brands],
  );

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
    let result = [...brands];
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (b) =>
          b.name?.toLowerCase().includes(q) ||
          b.code?.toLowerCase().includes(q),
      );
    }
    if (filterStatus === 'active') result = result.filter((b) => b.active);
    if (filterStatus === 'inactive') result = result.filter((b) => !b.active);
    result.sort((a, b) => {
      let av = '';
      let bv = '';
      if (sortField === 'name') { av = a.name || ''; bv = b.name || ''; }
      else if (sortField === 'code') { av = a.code || ''; bv = b.code || ''; }
      else if (sortField === 'status') { av = a.active ? 'active' : 'inactive'; bv = b.active ? 'active' : 'inactive'; }
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [brands, search, filterStatus, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openCreate = () => {
    setEditingBrand(null);
    setForm({ name: '', code: '' });
    setErrors({});
    setServerError('');
    setShowModal(true);
  };

  const openEdit = (brand) => {
    setEditingBrand(brand);
    setForm({ name: brand.name || '', code: brand.code || '' });
    setErrors({});
    setServerError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBrand(null);
    setServerError('');
    setErrors({});
  };

  const validate = () => {
    const nextErrors = {};
    const normalizedName = form.name.trim();
    const normalizedCode = form.code.trim().toUpperCase();

    if (!normalizedName) {
      nextErrors.name = 'Brand name is required';
    } else if (normalizedName.length > 120) {
      nextErrors.name = 'Brand name must not exceed 120 characters';
    }

    if (!normalizedCode) {
      nextErrors.code = 'Brand code is required';
    } else if (!/^[A-Z0-9_-]{2,60}$/.test(normalizedCode)) {
      nextErrors.code = 'Use 2-60 uppercase letters, numbers, underscore, or hyphen';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');

    if (!validate()) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
    };

    setSaving(true);
    try {
      if (isEditMode) {
        await updateBrand(editingBrand.id, payload);
        toast.success('Brand updated successfully');
      } else {
        await createBrand(payload);
        toast.success('Brand created successfully');
      }
      closeModal();
      await loadBrands();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save brand';
      if (error.response?.status === 409) {
        setServerError(message);
      } else {
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (brand) => {
    if (!brand.active) {
      return;
    }

    try {
      await deleteBrand(brand.id);
      toast.success('Brand deactivated successfully');
      await loadBrands();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to deactivate brand';
      toast.error(message);
    }
  };

  return (
    <AdminDeliveryLayout
      title="Brand Management"
      description="Curate and manage producer and brand partners used across supplier and product workflows."
      breadcrumbCurrent="Manage Brands"
      breadcrumbItems={[
        { label: 'Admin', to: '/admin' },
        { label: 'Manage Brands' },
      ]}
      actions={
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center rounded-xl bg-[#0d4a38] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#083a2c]"
        >
          + Create Brand
        </button>
      }
    >
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e4ebe8] bg-[#f4f7f6] px-4 py-3">
          <FiTag className="mb-2 h-5 w-5 text-[#6f817b]" />
          <p className="text-xs uppercase tracking-wide text-[#6f817b]">Total Brands</p>
          <p className="mt-1 text-2xl font-bold text-[#153a30]">{brands.length}</p>
        </div>
        <div className="rounded-xl border border-[#e4ebe8] bg-[#eaf5ef] px-4 py-3">
          <FiCheckCircle className="mb-2 h-5 w-5 text-[#0d4a38]" />
          <p className="text-xs uppercase tracking-wide text-[#0d4a38]">Active Brands</p>
          <p className="mt-1 text-2xl font-bold text-[#0d4a38]">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-[#e4ebe8] bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=60')] bg-cover bg-center px-4 py-3 text-white">
          <FiTrendingUp className="mb-2 h-5 w-5 text-white/80" />
          <p className="text-xs uppercase tracking-wide text-white/80">Partner Utilization</p>
          <p className="mt-1 text-2xl font-bold">{brands.length > 0 ? Math.round((activeCount / brands.length) * 100) : 0}%</p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-45 flex-1">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8fa89f]" />
          <input
            type="search"
            placeholder="Search by name or code..."
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
          <span className="text-xs text-[#6f817b]">{filtered.length} brand{filtered.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e4ebe8] bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#6f817b]">Loading brands...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6f817b]">
            {brands.length === 0 ? 'No brands found. Create your first brand.' : 'No brands match your search or filter.'}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-[#f5f8f7] text-xs uppercase tracking-wide text-[#7a8a85]">
                  <tr>
                    <SortableHeader label="Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Code" field="code" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((brand) => (
                    <tr key={brand.id} className="border-t border-[#edf2f0]">
                      <td className="px-4 py-3 font-semibold text-[#1f3b32]">{brand.name}</td>
                      <td className="px-4 py-3 text-[#425d55]">{brand.code}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            brand.active ? 'bg-[#c8f0da] text-[#1f6a4d]' : 'bg-[#e8efec] text-[#526b64]'
                          }`}
                        >
                          {brand.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEdit(brand)}
                            className="text-xs font-semibold text-[#526b64] hover:text-[#0d4a38]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeactivate(brand)}
                            disabled={!brand.active}
                            className="text-xs font-semibold text-[#ba3a3a] hover:text-[#a22f2f] disabled:cursor-not-allowed disabled:text-slate-400"
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {paged.map((brand) => (
                <article key={brand.id} className="rounded-xl border border-[#edf2ef] bg-[#fbfdfc] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1f3b32]">{brand.name}</p>
                      <p className="mt-1 text-xs text-[#6f817b]">Code: {brand.code}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        brand.active ? 'bg-[#c8f0da] text-[#1f6a4d]' : 'bg-[#e8efec] text-[#526b64]'
                      }`}
                    >
                      {brand.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => openEdit(brand)}
                      className="text-xs font-semibold text-[#526b64] hover:text-[#0d4a38]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeactivate(brand)}
                      disabled={!brand.active}
                      className="text-xs font-semibold text-[#ba3a3a] hover:text-[#a22f2f] disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      Deactivate
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#edf2f0] px-4 py-3">
                <span className="text-xs text-[#6f817b]">
                  Page {page + 1} of {totalPages} &middot; {filtered.length} brand{filtered.length !== 1 ? 's' : ''}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#e4ebe8] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#edf2f0] px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-[#153a30]">{isEditMode ? 'Edit Brand' : 'Create Brand'}</h2>
                <p className="mt-1 text-sm text-[#6f817b]">Keep names and codes unique for clean assignment workflows.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6f817b] transition hover:bg-[#f2f7f5]"
                aria-label="Close brand modal"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              {serverError && (
                <div className="rounded-lg border border-[#f2cccc] bg-[#fdecee] px-3 py-2 text-sm text-[#b03a3a]">
                  {serverError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-[#425d55]">Brand Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, name: event.target.value }));
                    if (errors.name) {
                      setErrors((prev) => ({ ...prev, name: '' }));
                    }
                  }}
                  className="h-10 w-full rounded-xl border border-[#d6e0dc] bg-[#f5f8f7] px-3 text-sm text-[#28433b] focus:border-[#0d4a38] focus:outline-none focus:ring-2 focus:ring-[#d8eae3]"
                />
                {errors.name && <p className="mt-1 text-xs text-[#ba3a3a]">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#425d55]">Brand Code</label>
                <input
                  name="code"
                  value={form.code}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }));
                    if (errors.code) {
                      setErrors((prev) => ({ ...prev, code: '' }));
                    }
                  }}
                  className="h-10 w-full rounded-xl border border-[#d6e0dc] bg-[#f5f8f7] px-3 text-sm uppercase text-[#28433b] focus:border-[#0d4a38] focus:outline-none focus:ring-2 focus:ring-[#d8eae3]"
                />
                {errors.code && <p className="mt-1 text-xs text-[#ba3a3a]">{errors.code}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-[#d5dfdb] bg-white px-4 py-2 text-sm font-medium text-[#526b64] transition hover:bg-[#f2f7f5] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#0d4a38] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#083a2c] disabled:opacity-60"
                >
                  {saving ? 'Saving...' : isEditMode ? 'Update Brand' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
