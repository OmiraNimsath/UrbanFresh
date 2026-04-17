import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiCreditCard, FiEdit2, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import DeliveryPageLayout from '../../components/delivery/DeliveryPageLayout';
import { getProfile, updateProfile } from '../../services/profileService';

/**
 * Delivery profile page for viewing and updating personal information.
 */
export default function DeliveryProfilePage() {
  const { updateUser, logout } = useAuth();
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  return (
    <DeliveryPageLayout
      activeKey="profile"
      onRefresh={() => window.location.reload()}
      onLogout={handleLogout}
    >
      <section className="rounded-[26px] bg-linear-to-r from-[#114f39] to-[#1b5a42] p-6 text-white shadow-sm sm:p-8">
        <h2 className="text-3xl font-semibold leading-tight sm:text-[32px]">Your Profile</h2>
        <p className="mt-3 max-w-xl text-base text-[#c6ddd4]">
          Manage your personal information and delivery preferences.
        </p>
      </section>

      <section className="mt-4 rounded-3xl border border-[#e4ebe8] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative h-24 w-24 rounded-2xl bg-[#f68a54]">
            <button
              type="button"
              className="absolute -bottom-2 -right-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white bg-[#01412d] text-white"
              aria-label="Edit profile image"
            >
              <FiEdit2 size={15} />
            </button>
          </div>
          <div>
            <p className="text-2xl font-semibold text-[#202827] sm:text-3xl">{form.name || 'Delivery Partner'}</p>
            <p className="text-base text-[#5d6865] sm:text-lg">Partner ID: #UF-88291</p>
            <span className="mt-2 inline-flex rounded-full bg-[#daf5e7] px-3 py-1 text-xs font-semibold text-[#0b6f4a]">
              ☆ 4.9 RATING
            </span>
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-3xl border border-[#e4ebe8] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium tracking-[0.08em] text-[#5f6d68]">Total Deliveries</p>
          <p className="mt-2 text-3xl font-semibold leading-none text-[#0d3f31] sm:text-4xl">1,284</p>
        </div>
        <div className="rounded-3xl border border-[#e4ebe8] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium tracking-[0.08em] text-[#5f6d68]">Earnings Today</p>
          <p className="mt-2 text-3xl font-semibold leading-none text-[#0d3f31] sm:text-4xl">Rs. 2,450</p>
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-[#e4ebe8] bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-2xl font-semibold text-[#0d3f31] sm:text-3xl">Personal Details</h3>

        {loading ? (
          <p className="text-sm text-slate-500">Loading profile...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-medium tracking-[0.08em] text-[#4e5d58]">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="mt-1 h-14 w-full rounded-2xl border border-[#d8e2dd] bg-[#edf1ef] px-4 text-base text-[#5b6662]"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-xs font-medium tracking-[0.08em] text-[#4e5d58]">Full Name</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`mt-1 h-14 w-full rounded-2xl border bg-[#edf1ef] px-4 text-lg text-[#262f2d] outline-none transition ${
                  fieldErrors.name ? 'border-red-400' : 'border-[#d8e2dd] focus:border-[#9ad3b7] focus:bg-white'
                }`}
                placeholder="Your full name"
              />
              {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-medium tracking-[0.08em] text-[#4e5d58]">Phone Number</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={`mt-1 h-14 w-full rounded-2xl border bg-[#edf1ef] px-4 text-lg text-[#262f2d] outline-none transition ${
                  fieldErrors.phone ? 'border-red-400' : 'border-[#d8e2dd] focus:border-[#9ad3b7] focus:bg-white'
                }`}
                placeholder="e.g. 0712345678"
              />
              {fieldErrors.phone ? <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p> : null}
            </div>

            <div>
              <label htmlFor="address" className="block text-xs font-medium tracking-[0.08em] text-[#4e5d58]">Home Address</label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={form.address}
                onChange={handleChange}
                className={`mt-1 w-full rounded-2xl border bg-[#edf1ef] px-4 py-3 text-lg text-[#262f2d] outline-none transition ${
                  fieldErrors.address ? 'border-red-400' : 'border-[#d8e2dd] focus:border-[#9ad3b7] focus:bg-white'
                }`}
                placeholder="Street, city, postal code"
              />
              {fieldErrors.address ? <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
              <button
                type="submit"
                disabled={saving}
                className="h-14 w-full rounded-2xl bg-[#01412d] px-4 text-base font-semibold text-white transition hover:bg-[#083a2c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="h-14 w-full rounded-2xl bg-[#dde2df] px-4 text-base font-medium text-[#202827] transition hover:bg-[#d4dad7]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <button type="button" className="flex items-center justify-between rounded-3xl border border-[#e4ebe8] bg-white p-5 text-left shadow-sm">
          <span className="flex items-center gap-3 text-[#183f32]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#a7ecc6]">
                <FiCreditCard size={22} />
            </span>
            <span>
              <span className="block text-xl font-semibold">Payout Settings</span>
                <span className="block text-base text-[#60706a]">Linked to bank account</span>
            </span>
          </span>
          <span className="text-3xl text-[#8ea59d]">›</span>
        </button>

        <button type="button" className="flex items-center justify-between rounded-3xl border border-[#e4ebe8] bg-white p-5 text-left shadow-sm">
          <span className="flex items-center gap-3 text-[#183f32]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#a7ecc6]">
              <FiShield size={22} />
            </span>
            <span>
                <span className="block text-xl font-semibold">Security & PIN</span>
                <span className="block text-base text-[#60706a]">Last updated recently</span>
            </span>
          </span>
          <span className="text-3xl text-[#8ea59d]">›</span>
        </button>
      </section>
    </DeliveryPageLayout>
  );
}
