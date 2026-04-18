import { useMemo, useState } from 'react';

/**
 * Presentation Layer – Modal for creating new delivery personnel accounts.
 * Collects name, email, secure password, and optional phone.
 * Provides real-time validation feedback and password strength indicator.
 * Parent component handles API submission and error display.
 */
export default function CreateDeliveryPersonnelModal({
  onClose,
  onSubmit,
  isSubmitting,
  mode = 'create',
  initialValues = null,
}) {
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';

  const [form, setForm] = useState({
    name: initialValues?.name || '',
    email: initialValues?.email || '',
    password: '',
    confirmPassword: '',
    phone: initialValues?.phone || '',
    status: initialValues?.isActive === false ? 'inactive' : 'active',
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  /** Validate password strength (0–4 points). */
  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[@$!%*?&#]/.test(pwd)) strength++;
    return strength;
  };

  /** Handle input change with real-time password strength calculation. */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Clear error for this field when user begins editing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /** Validate form before submission. */
  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (form.name.length < 2 || form.name.length > 100) {
      newErrors.name = 'Name must be between 2 and 100 characters';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email must be a valid format';
    }

    if (!isEditMode) {
      if (!form.password) {
        newErrors.password = 'Password is required';
      } else if (form.password.length < 8 || form.password.length > 64) {
        newErrors.password = 'Password must be between 8 and 64 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/.test(form.password)) {
        newErrors.password = 'Password must contain uppercase, lowercase, digit, and special character';
      }

      if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (form.phone && !/^\d{10,15}$/.test(form.phone)) {
      newErrors.phone = 'Phone must be 10–15 digits';
    }

    if (!['active', 'inactive'].includes(form.status)) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** Submit form to parent for API call. */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    if (isViewMode) {
      onClose();
      return;
    }

    // Submit without confirmPassword (server doesn't expect it)
    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone || null,
      isActive: form.status === 'active',
    });
  };

  const getPasswordStrengthLabel = () => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[passwordStrength] || 'Very Weak';
  };

  const getPasswordStrengthColor = () => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    return colors[passwordStrength] || 'bg-red-500';
  };

  const title = useMemo(() => {
    if (isViewMode) return 'Delivery Personnel Details';
    if (isEditMode) return 'Edit Delivery Personnel';
    return 'Create Delivery Personnel';
  }, [isEditMode, isViewMode]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 p-4 pt-10 backdrop-blur-sm sm:pt-14">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#e4ebe8] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#edf2f0] px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-[#153a30]">{title}</h2>
            <p className="mt-1 text-sm text-[#6f817b]">
              {isViewMode
                ? 'View account information and operational metadata.'
                : 'Capture account details and operational readiness settings.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6f817b] transition hover:bg-[#f2f7f5]"
            aria-label="Close delivery personnel modal"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-[#425d55]">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              disabled={isViewMode || isEditMode}
              placeholder="e.g. John Doe"
              className={`h-10 w-full rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-[#eef3f1] ${
                errors.name
                  ? 'border-[#e5a6ad] focus:ring-[#f2cccc]'
                  : 'border-[#d6e0dc] bg-[#f5f8f7] text-[#28433b] focus:border-[#0d4a38] focus:ring-[#d8eae3]'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-[#ba3a3a]">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#425d55]">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              disabled={isViewMode || isEditMode}
              placeholder="e.g. john@delivery.com"
              className={`h-10 w-full rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-[#eef3f1] ${
                errors.email
                  ? 'border-[#e5a6ad] focus:ring-[#f2cccc]'
                  : 'border-[#d6e0dc] bg-[#f5f8f7] text-[#28433b] focus:border-[#0d4a38] focus:ring-[#d8eae3]'
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-[#ba3a3a]">{errors.email}</p>}
          </div>

          {!isEditMode && !isViewMode && (
            <>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#425d55]">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  className={`h-10 w-full rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-[#e5a6ad] focus:ring-[#f2cccc]'
                      : 'border-[#d6e0dc] bg-[#f5f8f7] text-[#28433b] focus:border-[#0d4a38] focus:ring-[#d8eae3]'
                  }`}
                />
                {form.password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className={`h-2 w-16 rounded ${getPasswordStrengthColor()}`} />
                    <span className="text-xs font-semibold text-[#6f817b]">{getPasswordStrengthLabel()}</span>
                  </div>
                )}
                {errors.password && <p className="mt-1 text-xs text-[#ba3a3a]">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-[#425d55]">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className={`h-10 w-full rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? 'border-[#e5a6ad] focus:ring-[#f2cccc]'
                      : 'border-[#d6e0dc] bg-[#f5f8f7] text-[#28433b] focus:border-[#0d4a38] focus:ring-[#d8eae3]'
                  }`}
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-[#ba3a3a]">{errors.confirmPassword}</p>}
              </div>
            </>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-[#425d55]">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                disabled={isViewMode || isEditMode}
                placeholder="10-15 digits"
                className={`h-10 w-full rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-[#eef3f1] ${
                  errors.phone
                    ? 'border-[#e5a6ad] focus:ring-[#f2cccc]'
                    : 'border-[#d6e0dc] bg-[#f5f8f7] text-[#28433b] focus:border-[#0d4a38] focus:ring-[#d8eae3]'
                }`}
              />
              {errors.phone && <p className="mt-1 text-xs text-[#ba3a3a]">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-[#425d55]">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              disabled={isViewMode}
              className={`h-10 w-full rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-[#eef3f1] ${
                errors.status
                  ? 'border-[#e5a6ad] focus:ring-[#f2cccc]'
                  : 'border-[#d6e0dc] bg-[#f5f8f7] text-[#28433b] focus:border-[#0d4a38] focus:ring-[#d8eae3]'
              }`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {errors.status && <p className="mt-1 text-xs text-[#ba3a3a]">{errors.status}</p>}
          </div>

          {isEditMode && (
            <div className="rounded-lg border border-[#cde8d8] bg-[#eaf5ef] px-3 py-2 text-xs text-[#2f7f5f]">
              Personal details (Name, Email, Phone) are read-only in edit mode. Contact regional HQ to modify core profile credentials.
            </div>
          )}
        </form>

        <div className="flex justify-end gap-2 border-t border-[#edf2f0] bg-[#f8fbf9] px-6 py-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-[#d5dfdb] bg-white px-4 py-2 text-sm font-medium text-[#526b64] transition hover:bg-[#f2f7f5] disabled:opacity-60"
          >
            {isViewMode ? 'Close' : 'Cancel'}
          </button>
          {!isViewMode && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-[#0d4a38] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#083a2c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Status' : 'Create Account'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
