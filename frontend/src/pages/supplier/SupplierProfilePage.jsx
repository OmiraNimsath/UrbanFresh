import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import SupplierLayout from '../../components/supplier/SupplierLayout';
import { getProfile, updateProfile } from '../../services/profileService';
import { getSupplierBrands, getSupplierDashboard } from '../../services/supplierService';

/**
 * Presentation Layer - Supplier profile page for viewing and updating personal information.
 */
export default function SupplierProfilePage() {
  const { updateUser, logout, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [brands, setBrands] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const loadProfile = async () => {
    try {
      const [{ data: profile }, brandData, supplierDashboard] = await Promise.all([
        getProfile(),
        getSupplierBrands(),
        getSupplierDashboard(),
      ]);

      setEmail(profile.email || '');
      setBrands(brandData || []);
      setDashboardData(supplierDashboard || null);
      setForm({
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        address: profile.address ?? '',
      });
    } catch {
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
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

  const handleReset = () => {
    setFieldErrors({});
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
  };

  return (
    <SupplierLayout
      activeKey="profile"
      userName={form.name || user?.name}
      onLogout={handleLogout}
      pageTitle="My Profile"
      pageSubtitle="Manage your account details and supplier identity information"
      breadcrumbItems={[
        { label: 'Dashboard', to: '/supplier' },
        { label: 'My Profile' },
      ]}
    >
      {loading ? (
        <div className="rounded-2xl border border-[#e4ebe8] bg-white p-6 text-sm text-[#6f817b]">
          Loading profile...
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_2fr]">
          <aside className="space-y-5">
            <article className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f817b]">Supplier Account</p>
              <h2 className="mt-3 text-xl font-bold text-[#163a2f]">{form.name || 'Supplier User'}</h2>
              <p className="mt-1 text-sm text-[#6f817b]">{email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {brands.length > 0 ? (
                  brands.map((brand) => (
                    <span
                      key={brand.id}
                      className="inline-flex rounded-full bg-[#eaf5ef] px-2.5 py-1 text-xs font-semibold text-[#1c634b]"
                    >
                      {brand.name}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex rounded-full bg-[#f3f5f4] px-2.5 py-1 text-xs font-semibold text-[#5d726b]">
                    No brands assigned
                  </span>
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f817b]">Supplier Metrics</p>
              <div className="mt-3 space-y-3 text-sm text-[#325247]">
                <p>
                  Total Sales:{' '}
                  <span className="font-semibold text-[#163a2f]">
                    Rs. {(dashboardData?.totalSales || 0).toLocaleString('en-US')}
                  </span>
                </p>
                <p>
                  Pending Restocks:{' '}
                  <span className="font-semibold text-[#163a2f]">{dashboardData?.pendingRestocks || 0}</span>
                </p>
                <p>
                  Brand Count:{' '}
                  <span className="font-semibold text-[#163a2f]">{dashboardData?.brandNames?.length || 0}</span>
                </p>
              </div>
            </article>
          </aside>

          <section className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#26443a]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="h-11 w-full rounded-lg border border-[#d8e2de] bg-[#f3f7f5] px-3 text-sm text-[#7c8f89]"
                />
              </div>

              <FormInput
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                error={fieldErrors.name}
                placeholder="Supplier name"
              />

              <FormInput
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                error={fieldErrors.phone}
                placeholder="e.g. 0712345678"
              />

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#26443a]">Address</label>
                <textarea
                  name="address"
                  rows={3}
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street, city, postal code"
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-[#26443a] outline-none transition ${
                    fieldErrors.address
                      ? 'border-[#e5a6ad] bg-[#fffafb]'
                      : 'border-[#d8e2de] bg-[#f7f9f8] focus:border-[#0d4a38]'
                  }`}
                />
                {fieldErrors.address ? (
                  <p className="mt-1 text-xs text-[#ba3a3a]">{fieldErrors.address}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-[#edf2f0] pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-10 rounded-lg border border-[#dbe4e0] px-4 text-sm font-medium text-[#3d5951] transition hover:bg-[#f4f8f6]"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 rounded-lg bg-[#0d4a38] px-4 text-sm font-semibold text-white transition hover:bg-[#083a2c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </SupplierLayout>
  );
}

function FormInput({ label, name, value, onChange, error, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-[#26443a]">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`h-11 w-full rounded-lg border px-3 text-sm text-[#26443a] outline-none transition ${
          error ? 'border-[#e5a6ad] bg-[#fffafb]' : 'border-[#d8e2de] bg-[#f7f9f8] focus:border-[#0d4a38]'
        }`}
      />
      {error ? <p className="mt-1 text-xs text-[#ba3a3a]">{error}</p> : null}
    </div>
  );
}
