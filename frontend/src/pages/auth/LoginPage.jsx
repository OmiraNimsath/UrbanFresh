import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { loginUser } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

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
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-green-700">UrbanFresh</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Session expired banner */}
        {showExpiredBanner && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-700 text-sm text-center">
            Your session has expired. Please sign in again.
          </div>
        )}

        {/* Global error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-green-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-green-600 hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
