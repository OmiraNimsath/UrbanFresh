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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#e4ebe8] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#edf2f0] px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-[#153a30]">
              {isEditMode ? 'Edit Supplier Account' : 'Create Supplier'}
            </h2>
            <p className="mt-1 text-sm text-[#6f817b]">
              {isEditMode
                ? 'Update supplier details and assigned brands.'
                : 'Create supplier access and assign one or more brands.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6f817b] transition hover:bg-[#f2f7f5]"
            aria-label="Close supplier modal"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {apiError && (
            <div className="rounded-lg border border-[#f2cccc] bg-[#fdecee] px-3 py-2 text-sm text-[#b03a3a]">
              {apiError}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-[#425d55]">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={() => validateField('name')}
              className="h-10 w-full rounded-xl border border-[#d6e0dc] bg-[#f5f8f7] px-3 text-sm text-[#28433b] focus:border-[#0d4a38] focus:outline-none focus:ring-2 focus:ring-[#d8eae3]"
            />
            {errors.name && <p className="mt-1 text-xs text-[#ba3a3a]">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#425d55]">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onBlur={() => validateField('email')}
              disabled={isEditMode}
              className="h-10 w-full rounded-xl border border-[#d6e0dc] bg-[#f5f8f7] px-3 text-sm text-[#28433b] focus:border-[#0d4a38] focus:outline-none focus:ring-2 focus:ring-[#d8eae3] disabled:cursor-not-allowed disabled:bg-[#eef3f1]"
            />
            {errors.email && <p className="mt-1 text-xs text-[#ba3a3a]">{errors.email}</p>}
          </div>

          {!isEditMode && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#425d55]">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={() => validateField('password')}
                  className="h-10 w-full rounded-xl border border-[#d6e0dc] bg-[#f5f8f7] px-3 text-sm text-[#28433b] focus:border-[#0d4a38] focus:outline-none focus:ring-2 focus:ring-[#d8eae3]"
                />
                {errors.password && <p className="mt-1 text-xs text-[#ba3a3a]">{errors.password}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#425d55]">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => validateField('confirmPassword')}
                  className="h-10 w-full rounded-xl border border-[#d6e0dc] bg-[#f5f8f7] px-3 text-sm text-[#28433b] focus:border-[#0d4a38] focus:outline-none focus:ring-2 focus:ring-[#d8eae3]"
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-[#ba3a3a]">{errors.confirmPassword}</p>}
              </div>

              {form.password.length > 0 && (
                <div className="sm:col-span-2">
                  <div className="mb-1 flex gap-1">
                    {PASSWORD_RULES.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded ${
                          index < passwordStrengthCount ? 'bg-[#2f7f5f]' : 'bg-[#dce6e2]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
                    {PASSWORD_RULES.map((rule) => (
                      <p
                        key={rule.label}
                        className={rule.test(form.password) ? 'text-[#2f7f5f]' : 'text-[#6f817b]'}
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
            <label className="mb-1 block text-sm font-medium text-[#425d55]">Phone (optional)</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              onBlur={() => validateField('phone')}
              className="h-10 w-full rounded-xl border border-[#d6e0dc] bg-[#f5f8f7] px-3 text-sm text-[#28433b] focus:border-[#0d4a38] focus:outline-none focus:ring-2 focus:ring-[#d8eae3]"
            />
            {errors.phone && <p className="mt-1 text-xs text-[#ba3a3a]">{errors.phone}</p>}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-[#425d55]">Assign Brands</p>
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-[#d6e0dc] bg-[#f5f8f7] p-3">
              {brands.map((brand) => (
                <label key={brand.id} className="flex items-center gap-2 text-sm text-[#28433b]">
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
              <p className="mt-1 text-xs text-[#ba3a3a]">
                {errors.brandIds || 'No active brands available for assignment'}
              </p>
            )}
          </div>

          <div className="-mx-6 -mb-5 mt-1 flex justify-end gap-2 border-t border-[#edf2f0] bg-[#f8fbf9] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-[#d5dfdb] bg-white px-4 py-2 text-sm font-medium text-[#526b64] transition hover:bg-[#f2f7f5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || brands.length === 0 || !isFormValid}
              className="rounded-lg bg-[#0d4a38] px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? isEditMode
                  ? 'Saving...'
                  : 'Creating...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
