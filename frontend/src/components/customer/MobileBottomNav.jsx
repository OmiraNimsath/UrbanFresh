import { createElement } from 'react';
import { Link } from 'react-router-dom';
import { FiClipboard, FiShoppingBag, FiShoppingCart, FiUser } from 'react-icons/fi';

const ITEMS = [
  { key: 'shop', label: 'Shop', to: '/products', icon: FiShoppingBag },
  { key: 'cart', label: 'Cart', to: '/cart', icon: FiShoppingCart },
  { key: 'orders', label: 'Orders', to: '/orders', icon: FiClipboard },
  { key: 'profile', label: 'Profile', to: '/profile', icon: FiUser },
];

/**
 * Presentation Layer – Fixed bottom mobile nav for customer storefront pages.
 */
export default function MobileBottomNav({ activeKey = 'shop' }) {
  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[#d9e4df] bg-white/95 backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-4 px-2 py-2">
        {ITEMS.map(({ key, label, to, icon: ItemIcon }) => {
          const active = key === activeKey;

          return (
            <Link
              key={key}
              to={to}
              className={`mx-1 flex flex-col items-center justify-center rounded-xl py-1.5 text-[11px] font-medium transition-colors ${
                active
                  ? 'bg-[#0d4a38] text-white'
                  : 'text-[#6f817b] hover:bg-[#eef3f0] hover:text-[#163a2f]'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {createElement(ItemIcon, { size: 16, 'aria-hidden': 'true' })}
              <span className="mt-0.5">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
