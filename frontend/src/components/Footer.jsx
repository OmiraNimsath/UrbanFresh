import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-auto w-full bg-[#044b32] text-[#d2e5da]">
      <div className="grid w-full gap-10 px-10 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-white">UrbanFresh</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[#b9d3c5]">
            Curating nature&apos;s best produce at UrbanFresh, where every order delivers freshness.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#eff8f3]">Shop</h4>
          <ul className="mt-4 space-y-2 text-sm text-[#c1dacd]">
            <li>
              <Link to="/products" className="transition-colors hover:text-white">All Products</Link>
            </li>
            <li>
              <Link to="/products?category=Vegetables" className="transition-colors hover:text-white">Organic Vegetables</Link>
            </li>
            <li>
              <Link to="/products?category=Fruits" className="transition-colors hover:text-white">Fresh Fruits</Link>
            </li>
            <li>
              <Link to="/products?sortBy=price_asc" className="transition-colors hover:text-white">Best Offers</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#eff8f3]">Account</h4>
          <ul className="mt-4 space-y-2 text-sm text-[#c1dacd]">
            <li>
              <Link to="/login" className="transition-colors hover:text-white">Login</Link>
            </li>
            <li>
              <Link to="/register" className="transition-colors hover:text-white">Register</Link>
            </li>
            <li>
              <Link to="/profile" className="transition-colors hover:text-white">Profile</Link>
            </li>
            <li>
              <Link to="/orders" className="transition-colors hover:text-white">Orders</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#0f6848]">
        <div className="flex w-full flex-col items-center justify-between gap-3 px-10 py-5 text-xs text-[#9ec0ae] sm:flex-row">
          <span>© {new Date().getFullYear()} UrbanFresh Marketplace.</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
