import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiArrowRight, FiCircle, FiEye, FiEyeOff, FiUser, FiMail, FiCheckCircle } from 'react-icons/fi';
import { registerCustomer } from '../../services/authService';
import AuthShell from '../../components/auth/AuthShell';
import { getApiErrorMessage } from '../../utils/errorMessageUtils';

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
        setFieldErrors({ email: getApiErrorMessage(err, 'Email already registered') });
      } else {
        toast.error(getApiErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordStrengthCount = PASSWORD_RULES.filter((r) => r.test(form.password)).length;

  return (
    <AuthShell title="Create your account" subtitle="Join the digital greenhouse for premium produce.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="register-name" className="mb-1.5 block text-[14px] font-semibold text-[#3f5049]">
            Full Name
          </label>
          <div className="relative">
            <input
              id="register-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={`h-12 w-full rounded-[10px] border px-4 pr-11 text-[15px] text-[#21372f] placeholder:text-[#8d9893] outline-none transition ${
                fieldErrors.name
                  ? 'border-[#cf5252] bg-[#f6d3d0]'
                  : 'border-transparent bg-[#d8ddda] focus:border-[#9fb6ac]'
              }`}
            />
            <FiUser
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8a9590]"
              size={17}
              aria-hidden="true"
            />
          </div>
          {fieldErrors.name && <p className="mt-1 text-[12px] text-[#b22c2c]">{fieldErrors.name}</p>}
        </div>

        <div>
          <label htmlFor="register-email" className="mb-1.5 block text-[14px] font-semibold text-[#3f5049]">
            Email Address
          </label>
          <div className="relative">
            <input
              id="register-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`h-12 w-full rounded-[10px] border px-4 pr-11 text-[15px] text-[#21372f] placeholder:text-[#8d9893] outline-none transition ${
                fieldErrors.email
                  ? 'border-[#cf5252] bg-[#f6d3d0]'
                  : 'border-transparent bg-[#d8ddda] focus:border-[#9fb6ac]'
              }`}
            />
            <FiMail
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8a9590]"
              size={17}
              aria-hidden="true"
            />
          </div>
          {fieldErrors.email && <p className="mt-1 text-[12px] text-[#b22c2c]">{fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="register-password" className="mb-1.5 block text-[14px] font-semibold text-[#3f5049]">
            Password
          </label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              className={`h-12 w-full rounded-[10px] border px-4 pr-11 text-[15px] text-[#21372f] placeholder:text-[#8d9893] outline-none transition ${
                fieldErrors.password
                  ? 'border-[#cf5252] bg-[#f6d3d0]'
                  : 'border-transparent bg-[#d8ddda] focus:border-[#9fb6ac]'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f8d86] hover:text-[#355748]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
            </button>
          </div>
          {fieldErrors.password && <p className="mt-1 text-[12px] text-[#b22c2c]">{fieldErrors.password}</p>}

          {form.password.length > 0 && (
            <div className="mt-2.5 space-y-2">
              <div className="h-1.5 w-full overflow-hidden rounded bg-[#cfd6d2]">
                <div
                  className="h-full rounded bg-[#cb2424] transition-all"
                  style={{ width: `${(passwordStrengthCount / PASSWORD_RULES.length) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-1 gap-1 text-[12px] sm:grid-cols-2 sm:gap-x-3">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(form.password);
                  return (
                    <p
                      key={rule.label}
                      className={`inline-flex items-center gap-1.5 ${passed ? 'text-[#67746e]' : 'text-[#b22c2c]'}`}
                    >
                      {passed ? <FiCheckCircle size={12} aria-hidden="true" /> : <FiCircle size={11} aria-hidden="true" />}
                      {rule.label}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="register-phone" className="block text-[14px] font-semibold text-[#3f5049]">
              Phone Number
            </label>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a9590]">Optional</span>
          </div>
          <div className="flex gap-2.5">
            <div className="inline-flex h-12 w-18 items-center justify-center rounded-[10px] bg-[#d8ddda] text-[15px] font-semibold text-[#51645c]">
              +94
            </div>
            <input
              id="register-phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="98765 43210"
              className={`h-12 flex-1 rounded-[10px] border px-4 text-[15px] text-[#21372f] placeholder:text-[#8d9893] outline-none transition ${
                fieldErrors.phone
                  ? 'border-[#cf5252] bg-[#f6d3d0]'
                  : 'border-transparent bg-[#d8ddda] focus:border-[#9fb6ac]'
              }`}
            />
          </div>
          {fieldErrors.phone && <p className="mt-1 text-[12px] text-[#b22c2c]">{fieldErrors.phone}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-linear-to-r from-[#014d31] to-[#18553f] text-[17px] font-semibold text-white shadow-[0_10px_18px_rgba(1,77,49,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{loading ? 'Creating account...' : 'Create account'}</span>
          <FiArrowRight size={17} aria-hidden="true" />
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] text-[#586964]">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-[#1a4a39] hover:underline">
          Log In
        </Link>
      </p>
    </AuthShell>
  );
}
