import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getAdminProfile, updateAdminProfile } from '../../services/adminProfileService';

/**
 * Admin Profile Page Component
 * Layer: Presentation (React page)
 * Allows admin users to view and edit their profile details (name, phone, address).
 * Email is shown read-only as it's the account identifier.
 */
export default function AdminProfilePage() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  /**
   * Fetch admin profile on mount
   */
  useEffect(() => {
    getAdminProfile()
      .then((data) => {
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
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setSaving(true);

    const payload = {
      name: form.name,
      phone: form.phone || null,
      address: form.address || null,
    };

    try {
      const data = await updateAdminProfile(payload);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          <Link
            to="/admin"
            className="text-sm text-green-600 hover:text-green-800 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., John Admin"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  fieldErrors.name
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-200 focus:ring-green-200'
                }`}
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g., +94771234567"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  fieldErrors.phone
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-200 focus:ring-green-200'
                }`}
              />
              {fieldErrors.phone && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="e.g., 123 Green St, Colombo"
                rows="3"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
                  fieldErrors.address
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-200 focus:ring-green-200'
                }`}
              ></textarea>
              {fieldErrors.address && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.address}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
