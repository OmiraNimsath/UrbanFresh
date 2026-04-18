import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import AdminDeliveryLayout from '../../components/admin/delivery/AdminDeliveryLayout';
import { getAdminProfile, updateAdminProfile } from '../../services/adminProfileService';

/**
 * Presentation Layer – Admin profile page.
 */
export default function AdminProfilePage() {
  const { updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    getAdminProfile()
      .then((data) => {
        setEmail(data.email || '');
        setForm({
          name: data.name ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
        });
      })
      .catch(() => toast.error('Failed to load profile. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const initials = useMemo(() => {
    const source = form.name || 'Admin User';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((token) => token[0]?.toUpperCase())
      .join('');
  }, [form.name]);

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
      <AdminDeliveryLayout
        title="My Profile"
        description="Manage your administrative credentials and personal contact information."
        breadcrumbCurrent="My Profile"
      >
        <div className="rounded-2xl border border-[#e4ebe8] bg-white p-6 text-sm text-[#6f817b]">
          Loading your profile...
        </div>
      </AdminDeliveryLayout>
    );
  }

  return (
    <AdminDeliveryLayout
      title="My Profile"
      description="Manage your administrative credentials and personal contact information for the UrbanFresh Digital Greenhouse portal."
      breadcrumbCurrent="My Profile"
      breadcrumbItems={[
        { label: 'Dashboard', to: '/admin' },
        { label: 'My Profile' },
      ]}
    >
      <section className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        <article className="space-y-4">
          <div className="rounded-2xl border border-[#e4ebe8] bg-white p-6 shadow-sm">
            <div className="mx-auto inline-flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#9be7bf] bg-[radial-gradient(circle_at_30%_20%,#24463c_0%,#0f2620_72%)] text-4xl font-semibold text-[#d6ece3]">
              {initials || 'AU'}
            </div>
            <h2 className="mt-4 text-center text-3xl font-semibold text-[#13392f]">{form.name || 'Urban admin'}</h2>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-[#9be7bf] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0d4a38]">Administrator</span>
              <span className="rounded-full bg-[#c8f0da] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0d4a38]">Verified</span>
            </div>
          </div>

          <div className="rounded-2xl bg-[linear-gradient(145deg,#0b3f31,#145543)] p-5 text-white shadow-[0_14px_24px_rgba(7,45,35,0.3)]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#badfd0]">Total Managed Sales</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">Rs. 4,82,900</p>
          </div>
        </article>

        <article className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Email Address"
                value={email}
                disabled
                icon={
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4 8 8 6 8-6" />
                  </svg>
                }
              />

              <InputField
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                error={fieldErrors.name}
                placeholder="Urban admin"
                icon={
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
                  </svg>
                }
              />
            </div>

            <InputField
              label="Phone Number"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              error={fieldErrors.phone}
              placeholder="0776504569"
              icon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m22 16.9-4.7-2a2 2 0 0 0-2.3.6l-1.2 1.5a16.5 16.5 0 0 1-6.8-6.8l1.5-1.2a2 2 0 0 0 .6-2.3L7.1 2A2 2 0 0 0 4.8.9L2.6 1.5A2 2 0 0 0 1 3.4 19.6 19.6 0 0 0 20.6 23a2 2 0 0 0 1.9-1.6l.6-2.2a2 2 0 0 0-1.1-2.3Z" />
                </svg>
              }
            />

            <TextAreaField
              label="Office Address"
              name="address"
              value={form.address}
              onChange={handleChange}
              error={fieldErrors.address}
              placeholder="14/5C, Negambo road, Ja-ela"
            />

            <div className="flex flex-wrap justify-end gap-3 border-t border-[#edf2f0] pt-4">
              <button
                type="button"
                onClick={() => {
                  setFieldErrors({});
                  getAdminProfile()
                    .then((data) => {
                      setEmail(data.email || '');
                      setForm({
                        name: data.name ?? '',
                        phone: data.phone ?? '',
                        address: data.address ?? '',
                      });
                    })
                    .catch(() => toast.error('Failed to reset form values.'));
                }}
                className="h-11 rounded-xl border border-[#d2ddd8] bg-white px-5 text-sm font-semibold text-[#526b64] transition hover:bg-[#f2f7f5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-11 rounded-xl bg-[#0d4a38] px-6 text-sm font-semibold text-white transition hover:bg-[#083a2c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#d6f2e2] text-[#0d4a38]">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 7v5c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V7l-8-4Z" />
              </svg>
            </span>
            <div>
              <p className="text-lg font-semibold text-[#17392f]">Account Security</p>
              <p className="text-sm text-[#6f817b]">Last password change was 45 days ago. We recommend refreshing it every 90 days.</p>
            </div>
          </div>

          <button
            type="button"
            className="text-sm font-semibold text-[#0d4a38] underline decoration-[#a4cfbb] underline-offset-4"
          >
            Update Password
          </button>
        </div>
      </section>
    </AdminDeliveryLayout>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  error,
  disabled = false,
  placeholder,
  icon,
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-[#6f817b]">{label}</label>
      <div
        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
          disabled
            ? 'border-[#dce6e2] bg-[#f3f7f5] text-[#81948e]'
            : error
            ? 'border-[#e5a6ad] bg-[#fffafb] text-[#17392f]'
            : 'border-[#d2ddd8] bg-[#f8fbf9] text-[#17392f]'
        }`}
      >
        {icon ? <span className="text-[#6f817b]">{icon}</span> : null}
        <input
          className="w-full border-none bg-transparent p-0 text-base outline-none"
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-[#ba3a3a]">{error}</p> : null}
    </div>
  );
}

function TextAreaField({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-[#6f817b]">{label}</label>
      <textarea
        name={name}
        rows={3}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full resize-none rounded-xl border px-3 py-2.5 text-base outline-none ${
          error
            ? 'border-[#e5a6ad] bg-[#fffafb] text-[#17392f]'
            : 'border-[#d2ddd8] bg-[#f8fbf9] text-[#17392f]'
        }`}
      />
      {error ? <p className="mt-1 text-xs text-[#ba3a3a]">{error}</p> : null}
    </div>
  );
}
