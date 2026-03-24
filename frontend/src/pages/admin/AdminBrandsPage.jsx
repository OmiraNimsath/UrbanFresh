import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  createBrand,
  deleteBrand,
  getAllBrands,
  updateBrand,
} from '../../services/adminBrandService';

/**
 * Presentation Layer – Admin brand management page.
 */
export default function AdminBrandsPage() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [serverError, setServerError] = useState('');

  const [form, setForm] = useState({ name: '', code: '' });
  const [errors, setErrors] = useState({});

  const isEditMode = Boolean(editingBrand);

  useEffect(() => {
    loadBrands();
  }, []);

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
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate('/admin')}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-green-700"
        >
          <span aria-hidden="true">&larr;</span>
          <span>Back to Dashboard</span>
        </button>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-green-600">Admin Panel</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">Brand Management</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-600">
                Manage product brands used for supplier ownership and product categorization.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              + Create Brand
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-100 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Brands</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{brands.length}</p>
            </div>
            <div className="rounded-xl bg-green-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-green-700">Active Brands</p>
              <p className="mt-1 text-2xl font-bold text-green-700">{activeCount}</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading brands...</div>
            ) : brands.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No brands found. Create your first brand.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Code</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brands.map((brand) => (
                      <tr key={brand.id} className="border-t border-slate-200">
                        <td className="px-4 py-3 font-medium text-slate-900">{brand.name}</td>
                        <td className="px-4 py-3 text-slate-700">{brand.code}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              brand.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {brand.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <button
                              onClick={() => openEdit(brand)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeactivate(brand)}
                              disabled={!brand.active}
                              className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-400"
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
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">{isEditMode ? 'Edit Brand' : 'Create Brand'}</h2>
              <p className="mt-1 text-sm text-slate-600">Keep names and codes unique for clean assignment workflows.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              {serverError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {serverError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Brand Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, name: event.target.value }));
                    if (errors.name) {
                      setErrors((prev) => ({ ...prev, name: '' }));
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Brand Code</label>
                <input
                  name="code"
                  value={form.code}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }));
                    if (errors.code) {
                      setErrors((prev) => ({ ...prev, code: '' }));
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
                {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : isEditMode ? 'Update Brand' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
