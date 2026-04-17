import { Link } from 'react-router-dom';

const LINKS = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: '▦' },
  { key: 'orders', label: 'Orders', to: '/orders', icon: '◫' },
  { key: 'loyalty', label: 'Loyalty', to: '/loyalty', icon: '◌' },
  { key: 'settings', label: 'Settings', to: '/profile', icon: '⚙' },
];

export default function CustomerAccountSidebar({ activeKey, userName }) {
  return (
    <aside className="hidden lg:block">
      <div className="rounded-2xl border border-[#e4ebe8] bg-white p-4 shadow-sm">
        <div className="mb-4 border-b border-[#edf2ef] pb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#7e8d87]">Customer</p>
          <p className="mt-1 text-sm font-semibold text-[#1f3d32]">{userName || 'My Account'}</p>
        </div>

        <nav aria-label="Customer section navigation" className="space-y-1">
          {LINKS.map((link) => {
            const isActive = activeKey === link.key;
            return (
              <Link
                key={link.key}
                to={link.to}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border border-[#cae3d6] bg-[#eaf5ef] text-[#0d4a38]'
                    : 'text-[#5d7169] hover:bg-[#f5f8f6] hover:text-[#1f3d32]'
                }`}
              >
                <span aria-hidden="true" className="text-xs">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
