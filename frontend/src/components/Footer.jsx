import { Link } from 'react-router-dom';
import { FiShoppingBag, FiFeather } from 'react-icons/fi';

/**
 * Reusable Footer component – modern, clean, professional layout.
 * Keep markup simple and accessible. Designed to sit at page bottom
 * when parent uses flex column with main content allowed to grow.
 */
export default function Footer() {
  return (
    <footer className="w-full border-t border-[#e6e9e7] bg-[#f3f6f4] text-[#4b5f57]">
      <div className="mx-auto max-w-6xl px-6 py-8 md:flex md:items-start md:justify-between">
        <div className="max-w-lg">
          <p className="text-2xl font-semibold text-[#163e31]">UrbanFresh</p>
          <p className="mt-3 text-sm text-[#65726b]">
            Curating the finest organic harvest for your kitchen, delivered with farm-to-table integrity.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 md:mt-0 md:grid-cols-3">
          <div>
            <h4 className="text-xs font-medium uppercase text-[#7f8f88]">Navigation</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/" className="text-[#50645e] hover:text-[#173a2f]">Home</Link>
              </li>
              <li>
                <Link to="/products" className="text-[#50645e] hover:text-[#173a2f]">Products</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase text-[#7f8f88]">Member</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/login" className="text-[#50645e] hover:text-[#173a2f]">Login</Link>
              </li>
              <li>
                <Link to="/register" className="text-[#50645e] hover:text-[#173a2f]">Register</Link>
              </li>
            </ul>
          </div>

          <div className="flex items-start gap-3 md:justify-end">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1d4b3b] shadow-sm">
              <FiShoppingBag size={16} aria-hidden="true" />
            </span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1d4b3b] shadow-sm">
              <FiFeather size={16} aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-6 text-sm text-[#60726b]">
        <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
          <span>© {new Date().getFullYear()} UrbanFresh. All rights reserved.</span>
          <div className="flex gap-3">
            <Link to="/privacy" className="text-[#50645e] hover:text-[#173a2f]">Privacy</Link>
            <Link to="/terms" className="text-[#50645e] hover:text-[#173a2f]">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
