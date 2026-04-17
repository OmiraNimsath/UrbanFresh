import { Link } from 'react-router-dom';
import { FiLogOut, FiRefreshCw } from 'react-icons/fi';
import DeliveryBottomNav from './DeliveryBottomNav';

/**
 * Shared mobile-first layout for delivery pages with responsive shell and role navigation.
 */
export default function DeliveryPageLayout({
  activeKey = 'dashboard',
  pageTitle,
  pageTitleRight,
  children,
  onRefresh,
  onLogout,
}) {
  return (
    <div className="min-h-screen bg-[#f5f7f6]">
      <header className="sticky top-0 z-20 border-b border-[#e4ebe8] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold leading-none tracking-tight text-[#0d4a38] sm:text-[34px]">
                UrbanFresh
              </h1>
              <p className="mt-1 text-xs font-medium tracking-[0.08em] text-[#76a396] sm:text-sm">
                Delivery Portal
              </p>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-[#0d5f47] transition hover:border-[#d7e6df] hover:bg-[#eef5f1]"
                aria-label="Refresh"
              >
                <FiRefreshCw size={21} />
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-[#bf2424] transition hover:border-[#f1dddd] hover:bg-[#fff3f3]"
                aria-label="Log out"
              >
                <FiLogOut size={21} />
              </button>
            </div>
          </div>

          <nav className="mt-4 hidden flex-wrap gap-2 md:flex" aria-label="Delivery desktop navigation">
            <Link
              to="/delivery"
              className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition ${
                activeKey === 'dashboard'
                  ? 'border-[#97dec0] bg-[#dff8ea] text-[#0d4a38]'
                  : 'border-[#d3ddd9] bg-white text-[#3f5f54] hover:bg-[#eef4f1]'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/delivery/orders/current"
              className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition ${
                activeKey === 'orders'
                  ? 'border-[#97dec0] bg-[#dff8ea] text-[#0d4a38]'
                  : 'border-[#d3ddd9] bg-white text-[#3f5f54] hover:bg-[#eef4f1]'
              }`}
            >
              Current Orders
            </Link>
            <Link
              to="/delivery/orders/history"
              className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition ${
                activeKey === 'history'
                  ? 'border-[#97dec0] bg-[#dff8ea] text-[#0d4a38]'
                  : 'border-[#d3ddd9] bg-white text-[#3f5f54] hover:bg-[#eef4f1]'
              }`}
            >
              History
            </Link>
            <Link
              to="/delivery/profile"
              className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition ${
                activeKey === 'profile'
                  ? 'border-[#97dec0] bg-[#dff8ea] text-[#0d4a38]'
                  : 'border-[#d3ddd9] bg-white text-[#3f5f54] hover:bg-[#eef4f1]'
              }`}
            >
              My Profile
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-7">
        {pageTitle ? (
          <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
            <h2 className="text-3xl font-semibold leading-tight text-[#0d3f31] sm:text-[34px]">{pageTitle}</h2>
            {pageTitleRight}
          </div>
        ) : null}
        {children}
      </main>

      <DeliveryBottomNav activeKey={activeKey} />
    </div>
  );
}
