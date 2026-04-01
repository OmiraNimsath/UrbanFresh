import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import DeliveryPageLayout from '../../components/delivery/DeliveryPageLayout';
import { getProfile, updateProfile } from '../../services/profileService';

/**
 * Delivery profile page for viewing and updating personal information.
 */
export default function DeliveryProfilePage() {
  const { updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    getProfile()
      .then(({ data }) => {
        setEmail(data.email || '');
        setForm({
          name: data.name ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
        });
      })
      .catch(() => toast.error('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});

    try {
      const { data } = await updateProfile({
        name: form.name,
        phone: form.phone || null,
        address: form.address || null,
      });

      updateUser({
        name: data.name,
        phone: data.phone,
        address: data.address,
      });
      toast.success('Profile updated successfully.');
    } catch (error) {
      if (error?.response?.status === 400 && error?.response?.data?.errors) {
        setFieldErrors(error.response.data.errors);
      } else {
        toast.error(error?.response?.data?.message || 'Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <DeliveryPageLayout
      title="My Profile"
      subtitle="Keep your delivery contact information up to date."
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {loading ? (
          <p className="text-sm text-slate-500">Loading profile...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700">Full Name</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`mt-1 h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${
                  fieldErrors.name ? 'border-red-400' : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                }`}
                placeholder="Your full name"
              />
              {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">Phone</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={`mt-1 h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${
                  fieldErrors.phone ? 'border-red-400' : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                }`}
                placeholder="e.g. 0712345678"
              />
              {fieldErrors.phone ? <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p> : null}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-slate-700">Address</label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={form.address}
                onChange={handleChange}
                className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                  fieldErrors.address ? 'border-red-400' : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                }`}
                placeholder="Street, city, postal code"
              />
              {fieldErrors.address ? <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p> : null}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="h-11 w-full rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}
      </section>
    </DeliveryPageLayout>
  );
}
