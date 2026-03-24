import { useState } from 'react';

/**
 * Presentation Layer – Modal for creating and editing supplier accounts with brand assignments.
 */
export default function CreateSupplierModal({
  brands,
  onClose,
  onSubmit,
  isSubmitting,
  initialSupplier = null,
  apiError = '',
}) {
  const isEditMode = Boolean(initialSupplier);

  const [form, setForm] = useState({
    name: initialSupplier?.name || '',
    email: initialSupplier?.email || '',
    password: '',
    confirmPassword: '',
    phone: initialSupplier?.phone || '',
    brandIds: initialSupplier?.brands?.map((brand) => brand.id) || [],
  });
  const [errors, setErrors] = useState({});

  const PASSWORD_RULES = [
    { label: 'At least 8 characters', test: (value) => value.length >= 8 },
    { label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
    { label: 'One lowercase letter', test: (value) => /[a-z]/.test(value) },
    { label: 'One digit', test: (value) => /\d/.test(value) },
    { label: 'One special character (@$!%*?&#)', test: (value) => /[@$!%*?&#]/.test(value) },
  ];

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const isPasswordStrong = PASSWORD_RULES.every((rule) => rule.test(form.password));
  const isConfirmPasswordValid = isEditMode || (form.confirmPassword && form.password === form.confirmPassword);

  const isFormValid =
    form.name.trim().length >= 2 &&
    form.name.trim().length <= 100 &&
    (isEditMode || (form.email.trim() && isEmailValid)) &&
    (isEditMode || isPasswordStrong) &&
    isConfirmPasswordValid &&
    (!form.phone.trim() || /^\d{10,15}$/.test(form.phone.trim())) &&
    form.brandIds.length > 0;

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

  const validateField = (name) => {
    const nextErrors = { ...errors };
    const normalizedName = form.name.trim();
    const normalizedEmail = form.email.trim();
    const normalizedPhone = form.phone.trim();

    if (name === 'name') {
      if (!normalizedName) {
        nextErrors.name = 'Name is required';
      } else if (normalizedName.length < 2 || normalizedName.length > 100) {
        nextErrors.name = 'Name must be between 2 and 100 characters';
      }
    }

    if (name === 'email' && !isEditMode) {
      if (!normalizedEmail) {
        nextErrors.email = 'Email is required';
      } else if (!isEmailValid) {
        nextErrors.email = 'Enter a valid email address';
      }
    }

    if (name === 'password' && !isEditMode) {
      if (!form.password) {
        nextErrors.password = 'Password is required';
      } else if (!isPasswordStrong) {
        nextErrors.password = 'Password does not meet all requirements';
      }
    }

    if (name === 'confirmPassword' && !isEditMode) {
      if (!form.confirmPassword) {
        nextErrors.confirmPassword = 'Confirm password is required';
      } else if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (name === 'phone') {
      if (normalizedPhone && !/^\d{10,15}$/.test(normalizedPhone)) {
        nextErrors.phone = 'Phone must be 10-15 digits';
      }
    }

    if (name === 'brandIds') {
      if (form.brandIds.length === 0) {
        nextErrors.brandIds = 'Select at least one brand';
      }
    }

    setErrors(nextErrors);
  };

  const validate = () => {
    const nextErrors = {};
    const normalizedName = form.name.trim();
    const normalizedEmail = form.email.trim();
    const normalizedPhone = form.phone.trim();

    if (!normalizedName) {
      nextErrors.name = 'Name is required';
    } else if (normalizedName.length < 2 || normalizedName.length > 100) {
      nextErrors.name = 'Name must be between 2 and 100 characters';
    }

    if (!isEditMode) {
      if (!normalizedEmail) {
        nextErrors.email = 'Email is required';
      } else if (!isEmailValid) {
        nextErrors.email = 'Enter a valid email address';
      }

      if (!form.password) {
        nextErrors.password = 'Password is required';
      } else if (!isPasswordStrong) {
        nextErrors.password = 'Password does not meet all requirements';
      }

      if (!form.confirmPassword) {
        nextErrors.confirmPassword = 'Confirm password is required';
      } else if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (normalizedPhone && !/^\d{10,15}$/.test(normalizedPhone)) {
      nextErrors.phone = 'Phone must be 10-15 digits';
    }

    if (form.brandIds.length === 0) nextErrors.brandIds = 'Select at least one brand';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    if (isEditMode) {
      onSubmit({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        brandIds: form.brandIds,
      });
      return;
    }

    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim() || null,
      brandIds: form.brandIds,
    });
  };

  const passwordStrengthCount = PASSWORD_RULES.filter((rule) => rule.test(form.password)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">
            {isEditMode ? 'Edit Supplier Account' : 'Create Supplier Account'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {isEditMode
              ? 'Update supplier details and assigned brands.'
              : 'Create supplier access and assign one or more brands.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {apiError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={() => validateField('name')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onBlur={() => validateField('email')}
              disabled={isEditMode}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          {!isEditMode && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={() => validateField('password')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
                {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => validateField('confirmPassword')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
                {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
              </div>

              {form.password.length > 0 && (
                <div className="sm:col-span-2">
                  <div className="mb-1 flex gap-1">
                    {PASSWORD_RULES.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded ${
                          index < passwordStrengthCount ? 'bg-green-500' : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
                    {PASSWORD_RULES.map((rule) => (
                      <p
                        key={rule.label}
                        className={rule.test(form.password) ? 'text-green-600' : 'text-slate-500'}
                      >
                        {rule.test(form.password) ? '✓' : '○'} {rule.label}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone (optional)</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              onBlur={() => validateField('phone')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Assign Brands</p>
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-slate-300 p-3">
              {brands.map((brand) => (
                <label key={brand.id} className="flex items-center gap-2 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    checked={form.brandIds.includes(brand.id)}
                    onChange={() => handleBrandToggle(brand.id)}
                    onBlur={() => validateField('brandIds')}
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

          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 -mx-6 -mb-5 mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || brands.length === 0 || !isFormValid}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? isEditMode
                  ? 'Saving...'
                  : 'Creating...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Create Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
