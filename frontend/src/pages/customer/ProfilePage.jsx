import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile } from '../../services/profileService';
import { getLoyaltyPoints } from '../../services/orderService';
import CustomerAccountLayout from '../../components/customer/CustomerAccountLayout';

export default function ProfilePage() {
  const { updateUser, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    Promise.allSettled([getProfile(), getLoyaltyPoints()])
      .then(([profileResult, loyaltyResult]) => {
        if (profileResult.status === 'fulfilled') {
          const { data } = profileResult.value;
          setEmail(data.email);
          setForm({
            name: data.name ?? '',
            phone: data.phone ?? '',
            address: data.address ?? '',
          });
        } else {
          toast.error('Failed to load profile. Please try again.');
        }

        if (loyaltyResult.status === 'fulfilled') {
          setLoyaltyPoints(Number(loyaltyResult.value?.data?.totalPoints || 0));
        }
      })
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
    setFieldErrors({});
    setSaving(true);

    const payload = {
      name: form.name,
      phone: form.phone || null,
      address: form.address || null,
    };

    try {
      const { data } = await updateProfile(payload);
      updateUser({ name: data.name });
      toast.success('Profile updated successfully!');
    } catch (err) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        setFieldErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to save changes. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const aside = (
    <>
      <div className="rounded-2xl bg-[#0d4a38] p-4 text-white shadow-sm">
        <p className="text-xs uppercase tracking-wide text-[#b6d4c7]">Impact points</p>
        <p className="mt-1 text-3xl font-semibold">{loyaltyPoints}</p>
        <p className="mt-1 text-xs text-[#d5e7de]">Keep your account details up to date for faster checkout.</p>
      </div>

      <div className="rounded-2xl border border-[#e4ebe8] bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-[#163a2f]">Weekly Harvest</p>
        <p className="mt-2 text-xs text-[#6f817b]">Fresh arrivals and seasonal bundles appear in your store feed every week.</p>
        <div className="mt-3 rounded-lg bg-[#eef4f1] p-3 text-center text-3xl" aria-hidden="true">🥕</div>
      </div>
    </>
  );

  return (
    <CustomerAccountLayout
      userName={user?.name}
      activeSection="settings"
      mobileActiveKey="profile"
      title="My Profile"
      subtitle="Manage your personal information and delivery preferences."
      breadcrumbItems={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Settings' }]}
      rightAside={aside}
    >
      <section className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#163a2f]">Profile information</h2>
          {loading && <span className="text-xs text-[#7c8b85]">Loading...</span>}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#7c8b85]">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-lg border border-[#dfe7e3] bg-[#f3f6f4] px-3 py-2.5 text-sm text-[#6f817b]"
            />
          </div>

          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#7c8b85]">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[#1d3a2f] focus:outline-none focus:ring-2 focus:ring-[#c6ded2] ${
                fieldErrors.name ? 'border-[#e2a7ac]' : 'border-[#dfe7e3]'
              }`}
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-[#b63a3a]">{fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#7c8b85]">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[#1d3a2f] focus:outline-none focus:ring-2 focus:ring-[#c6ded2] ${
                fieldErrors.phone ? 'border-[#e2a7ac]' : 'border-[#dfe7e3]'
              }`}
            />
            {fieldErrors.phone && <p className="mt-1 text-xs text-[#b63a3a]">{fieldErrors.phone}</p>}
          </div>

          <div>
            <label htmlFor="address" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#7c8b85]">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              value={form.address}
              onChange={handleChange}
              className={`w-full resize-none rounded-lg border px-3 py-2.5 text-sm text-[#1d3a2f] focus:outline-none focus:ring-2 focus:ring-[#c6ded2] ${
                fieldErrors.address ? 'border-[#e2a7ac]' : 'border-[#dfe7e3]'
              }`}
            />
            {fieldErrors.address && <p className="mt-1 text-xs text-[#b63a3a]">{fieldErrors.address}</p>}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={saving || loading}
              className="rounded-lg bg-[#0d4a38] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#083a2c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-[#d9e4df] bg-white px-4 py-2 text-sm font-medium text-[#3d6254]"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </CustomerAccountLayout>
  );
}
