import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiAlertCircle, FiClock, FiEye, FiEyeOff, FiMail, FiArrowRight } from 'react-icons/fi';
import { loginUser } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import AuthShell from '../../components/auth/AuthShell';

/**
 * Presentation Layer – Login form.
 * Authenticates the user via POST /api/auth/login,
 * stores the JWT via AuthContext, and redirects based on role.
 * Shows a session-expired banner when redirected with ?expired=true.
 */

/** Map backend role to the correct dashboard path. */
const ROLE_DASHBOARD = {
  CUSTOMER: '/',
  ADMIN: '/admin',
  SUPPLIER: '/supplier',
  DELIVERY: '/delivery',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, sessionExpired, clearSessionExpired } = useAuth();
  const [showExpiredBanner, setShowExpiredBanner] = useState(false);

  // Show session-expired banner when redirected from ProtectedRoute or auto-expiry
  useEffect(() => {
    if (sessionExpired || searchParams.get('expired') === 'true') {
      setShowExpiredBanner(true);
      clearSessionExpired();
    }
  }, [sessionExpired, searchParams, clearSessionExpired]);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const { data } = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      // Store token and user info in AuthContext + localStorage
      login(data.token, {
        email: data.email,
        name: data.name,
        role: data.role,
        phone: data.phone,
        address: data.address,
      });

      setShowExpiredBanner(false);
      toast.success(`Welcome back, ${data.name}!`);

      // Redirect to role-specific dashboard
      const destination = ROLE_DASHBOARD[data.role] || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 401) {
        setError(message || 'Invalid email or password');
      } else if (status === 403) {
        setError(message || 'Access denied for this account');
      } else if (status === 400) {
        setError(message || 'Please fill in all fields correctly');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Login" subtitle="Welcome Back!">
      {showExpiredBanner && (
        <div className="mb-3 flex items-start gap-2 rounded-[10px] bg-[#b4ebc9] px-4 py-3 text-[14px] font-medium leading-5 text-[#226548]">
          <FiClock className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
          <span>Your session has expired. Please sign in again.</span>
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-[10px] bg-[#f6d3d0] px-4 py-3 text-[14px] font-semibold leading-5 text-[#b22c2c]">
          <FiAlertCircle className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-[14px] font-semibold text-[#3f5049]">
            Email Address
          </label>
          <div className="relative">
            <input
              id="login-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="h-12 w-full rounded-[10px] border border-transparent bg-[#d8ddda] px-4 pr-11 text-[15px] text-[#21372f] placeholder:text-[#8d9893] outline-none transition focus:border-[#9fb6ac]"
            />
            <FiMail
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8a9590]"
              size={17}
              aria-hidden="true"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="block text-[14px] font-semibold text-[#3f5049]">
              Password
            </label>
            <span className="text-[12px] font-semibold text-[#355748]">Forgot?</span>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="h-12 w-full rounded-[10px] border border-transparent bg-[#d8ddda] px-4 pr-11 text-[15px] text-[#21372f] placeholder:text-[#8d9893] outline-none transition focus:border-[#9fb6ac]"
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-linear-to-r from-[#014d31] to-[#18553f] text-[17px] font-semibold text-white shadow-[0_10px_18px_rgba(1,77,49,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{loading ? 'Signing in...' : 'Log In'}</span>
          <FiArrowRight size={17} aria-hidden="true" />
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] text-[#586964]">
        New to UrbanFresh?{' '}
        <Link to="/register" className="font-semibold text-[#1a4a39] hover:underline">
          Create Account
        </Link>
      </p>
    </AuthShell>
  );
}
