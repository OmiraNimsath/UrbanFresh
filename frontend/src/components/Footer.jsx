import { Link } from 'react-router-dom';
import { FiArrowRight, FiFacebook, FiInstagram, FiTwitter } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="mt-auto w-full bg-[#044b32] text-[#d2e5da]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-white">UrbanFresh</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[#b9d3c5]">
            Curating nature&apos;s best produce at UrbanFresh, where every order delivers freshness.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0a6042] text-[#d7efe2]">
              <FiTwitter size={14} aria-hidden="true" />
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0a6042] text-[#d7efe2]">
              <FiFacebook size={14} aria-hidden="true" />
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0a6042] text-[#d7efe2]">
              <FiInstagram size={14} aria-hidden="true" />
            </span>
          </div>
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
              <Link to="/dashboard" className="transition-colors hover:text-white">Profile</Link>
            </li>
            <li>
              <Link to="/products" className="transition-colors hover:text-white">Orders</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#eff8f3]">Weekly Harvest</h4>
          <p className="mt-3 text-sm leading-6 text-[#b9d3c5]">
            Join our seasonal updates to receive curated produce drops and offers.
          </p>
          <form className="mt-5 flex items-center gap-2 rounded-xl bg-[#0a6042] p-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-[#b4d2c2] focus:outline-none"
              aria-label="Email address"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#0d4f37]"
            >
              Join
              <FiArrowRight size={12} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-[#0f6848]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-[#9ec0ae] sm:flex-row">
          <span>© {new Date().getFullYear()} UrbanFresh Marketplace. Terms and Privacy.</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
