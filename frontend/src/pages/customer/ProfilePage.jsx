import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile } from '../../services/profileService';

/**
 * Presentation Layer – Customer profile view and edit page.
 * Loads the current user's profile on mount, allows editing name / phone / address,
 * and persists changes via PUT /api/profile.
 * Email is shown read-only because it is the account identifier.
 */
export default function ProfilePage() {
  const { updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  // email is display-only; kept in separate state to avoid accidental submission
  const [email, setEmail] = useState('');

  // Field-level validation errors returned by the backend (400)
  const [fieldErrors, setFieldErrors] = useState({});

  /** Fetch profile once on mount. */
  useEffect(() => {
    getProfile()
      .then(({ data }) => {
        setEmail(data.email);
        setForm({
          name: data.name ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
        });
      })
      .catch(() => toast.error('Failed to load profile. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear the field error as the user types so feedback is timely
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setSaving(true);

    // Send null for optional fields that were cleared to preserve existing DB value
    const payload = {
      name: form.name,
      phone: form.phone || null,
      address: form.address || null,
    };

    try {
      const { data } = await updateProfile(payload);
      // Keep navbar name in sync – only patch, do not re-trigger the expiry timer
      updateUser({ name: data.name });
      toast.success('Profile updated successfully!');
    } catch (err) {
      const status = err.response?.status;
      if (status === 400 && err.response.data?.errors) {
        setFieldErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to save changes. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-green-700">My Profile</h1>
          <Link
            to="/dashboard"
            className="text-sm text-green-600 hover:text-green-800 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-8">
          <form onSubmit={handleSubmit} noValidate>

            {/* Email – read only */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
            </div>

            {/* Name */}
            <div className="mb-5">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition ${
                  fieldErrors.name ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="Your full name"
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="mb-5">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition ${
                  fieldErrors.phone ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="e.g. 0712345678"
              />
              {fieldErrors.phone && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            {/* Address */}
            <div className="mb-7">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={form.address}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition resize-none ${
                  fieldErrors.address ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="Street, city, postal code"
              />
              {fieldErrors.address && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.address}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
