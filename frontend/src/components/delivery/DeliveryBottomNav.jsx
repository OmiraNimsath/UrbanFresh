import { Link } from 'react-router-dom';
import { FiGrid, FiRotateCcw, FiTruck, FiUser } from 'react-icons/fi';

const ITEMS = [
  { key: 'dashboard', label: 'Dashboard', to: '/delivery', Icon: FiGrid },
  { key: 'orders', label: 'Orders', to: '/delivery/orders/current', Icon: FiTruck },
  { key: 'history', label: 'History', to: '/delivery/orders/history', Icon: FiRotateCcw },
  { key: 'profile', label: 'Profile', to: '/delivery/profile', Icon: FiUser },
];

/**
 * Fixed bottom mobile navigation for delivery role pages.
 */
export default function DeliveryBottomNav({ activeKey = 'dashboard' }) {
  return (
    <nav
      aria-label="Delivery bottom navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[#d9e4df] bg-white/95 backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-4 px-2 py-2">
        {ITEMS.map((item) => {
          const active = activeKey === item.key;

          return (
            <Link
              key={item.key}
              to={item.to}
              className={`mx-1 flex flex-col items-center justify-center rounded-2xl py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-[#9fe8c4] text-[#0f4433]'
                  : 'text-[#7aaea0] hover:bg-[#eef3f0] hover:text-[#163a2f]'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <item.Icon size={18} aria-hidden="true" />
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}