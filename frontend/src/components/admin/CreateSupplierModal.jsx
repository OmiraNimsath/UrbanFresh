import { useState } from 'react';

/**
 * Presentation Layer – Modal for creating supplier accounts with brand assignments.
 */
export default function CreateSupplierModal({ brands, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    brandIds: [],
  });
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBrandToggle = (brandId) => {
    setForm((prev) => {
      const exists = prev.brandIds.includes(brandId);
      const nextIds = exists
        ? prev.brandIds.filter((id) => id !== brandId)
        : [...prev.brandIds, brandId];
      return { ...prev, brandIds: nextIds };
    });

    if (errors.brandIds) {
      setErrors((prev) => ({ ...prev, brandIds: '' }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!form.email.trim()) nextErrors.email = 'Email is required';
    if (!form.password) nextErrors.password = 'Password is required';
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    if (form.brandIds.length === 0) nextErrors.brandIds = 'Select at least one brand';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim() || null,
      brandIds: form.brandIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Create Supplier Account</h2>
          <p className="text-sm text-gray-500 mt-1">Assign one or more brands during onboarding</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Assign Brands</p>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
              {brands.map((brand) => (
                <label key={brand.id} className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={form.brandIds.includes(brand.id)}
                    onChange={() => handleBrandToggle(brand.id)}
                  />
                  <span>{brand.name}</span>
                </label>
              ))}
            </div>
            {(errors.brandIds || brands.length === 0) && (
              <p className="text-xs text-red-600 mt-1">
                {errors.brandIds || 'No active brands available for assignment'}
              </p>
            )}
          </div>
        </form>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || brands.length === 0}
            className="px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Creating...' : 'Create Supplier'}
          </button>
        </div>
      </div>
    </div>
  );
}
