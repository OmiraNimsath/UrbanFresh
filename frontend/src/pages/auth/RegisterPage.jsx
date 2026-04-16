import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { registerCustomer } from '../../services/authService';

/**
 * Presentation Layer – Customer registration form.
 * Handles client-side validation, submits to POST /api/auth/register,
 * and maps backend field errors back to the form fields.
 */

const INITIAL_FORM = { name: '', email: '', password: '', phone: '' };

// Password rules mirroring backend @Pattern constraint
const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One digit', test: (p) => /\d/.test(p) },
  { label: 'One special character (@$!%*?&#)', test: (p) => /[@$!%*?&#]/.test(p) },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /** Update a single form field and clear its error. */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  /** Client-side validation before hitting the API. */
  const validate = () => {
    const errors = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errors.name = 'Name must be at least 2 characters';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = 'Enter a valid email address';
    if (!form.password)
      errors.password = 'Password is required';
    else if (!PASSWORD_RULES.every((r) => r.test(form.password)))
      errors.password = 'Password does not meet all requirements';
    if (form.phone && !/^\d{10,15}$/.test(form.phone))
      errors.phone = 'Phone must be 10–15 digits';
    return errors;
  };

  /** Submit handler — calls register API and redirects on success. */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await registerCustomer({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone || null,
      });
      toast.success('Account created! Please log in.');
      navigate('/login');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 400 && data?.errors) {
        // Map backend field-level validation errors back to the form
        setFieldErrors(data.errors);
      } else if (status === 409) {
        setFieldErrors({ email: data?.message || 'Email already registered' });
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordStrengthCount = PASSWORD_RULES.filter((r) => r.test(form.password)).length;

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-0 mb-1">
            <img src="/logo.svg" alt="UrbanFresh logo" className="h-10 w-10" />
            <h1 className="text-3xl font-bold text-green-600">UrbanFresh</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${
                fieldErrors.name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {fieldErrors.name && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${
                fieldErrors.email ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 pr-16 ${
                  fieldErrors.password ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-green-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
            )}

            {/* Password strength checklist — shown while typing */}
            {form.password.length > 0 && (
              <div className="mt-2 space-y-1">
                {/* Strength bar */}
                <div className="flex gap-1">
                  {PASSWORD_RULES.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${
                        i < passwordStrengthCount ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                {PASSWORD_RULES.map((rule) => (
                  <p
                    key={rule.label}
                    className={`text-xs ${rule.test(form.password) ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {rule.test(form.password) ? '✓' : '○'} {rule.label}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Phone (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="10–15 digits"
              className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${
                fieldErrors.phone ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {fieldErrors.phone && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
