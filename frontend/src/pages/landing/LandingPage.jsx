import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedProducts, getNearExpiryProducts } from '../../services/productService';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import MobileBottomNav from '../../components/customer/MobileBottomNav';
import { useAuth } from '../../context/AuthContext';
import { formatPrice, calculateDiscountedPrice } from '../../utils/priceUtils';

/**
 * Page Layer – Public landing page for UrbanFresh.
 * Displays a hero banner, featured products, and near-expiry offers.
 * Accessible without authentication; shows login/register links in the nav.
 */
export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [nearExpiry, setNearExpiry] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingNearExpiry, setLoadingNearExpiry] = useState(true);
  const [errorFeatured, setErrorFeatured] = useState(null);
  const [errorNearExpiry, setErrorNearExpiry] = useState(null);

  useEffect(() => {
    // Fetch both sections independently so one failure doesn't blank the whole page
    getFeaturedProducts()
      .then(setFeatured)
      .catch(() => setErrorFeatured('Could not load featured products.'))
      .finally(() => setLoadingFeatured(false));

    getNearExpiryProducts(7)
      .then(setNearExpiry)
      .catch(() => setErrorNearExpiry('Could not load near-expiry offers.'))
      .finally(() => setLoadingNearExpiry(false));
  }, []);

  // Derive the dashboard path so the hero CTA sends authenticated
  // users directly to their role-specific dashboard
  const heroDashboard = { CUSTOMER: '/dashboard', ADMIN: '/admin', SUPPLIER: '/supplier', DELIVERY: '/delivery' }[user?.role] || '/dashboard';

  return (
    <div className="min-h-screen bg-[#f3f4f3] text-[#15261f] flex flex-col">
      {/* ── Navigation (auth-aware via shared Navbar) ── */}
      <Navbar />

      {/* ── Hero ── */}
      <section className="px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 rounded-[28px] bg-[#eef2ef] p-6 sm:p-8 md:grid-cols-2 md:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5f7269]">UrbanFresh</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-[#113326] sm:text-5xl">
              Freshness Delivered to Your Doorstep.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#5f7269] sm:text-base">
              Experience the ultimate grocery shopping with UrbanFresh. Quality products, lightning-fast delivery.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/products"
                className="rounded-lg bg-[#0f5b3f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0a4831]"
              >
                Shop Now
              </Link>
              {isAuthenticated ? (
                <Link
                  to={heroDashboard}
                  className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#1f3e32] shadow-sm ring-1 ring-[#d4ddd8] transition-colors hover:bg-[#f8faf9]"
                >
                  My Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#1f3e32] shadow-sm ring-1 ring-[#d4ddd8] transition-colors hover:bg-[#f8faf9]"
                >
                  Learn More
                </Link>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -bottom-6 -left-4 h-24 w-24 rounded-full bg-[#dce8e1] blur-xl" aria-hidden="true" />
            <div className="overflow-hidden rounded-2xl bg-white p-3 shadow-[0_16px_34px_rgba(15,56,38,0.12)]">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80"
                alt="Fresh basket of vegetables"
                className="h-64 w-full rounded-xl object-cover sm:h-72"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="pb-12 pt-3 sm:pt-5">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-[30px] font-semibold leading-tight text-[#152f25]">Today&apos;s Featured Picks</h2>
            <Link to="/products" className="text-sm font-medium text-[#2b5f49] hover:text-[#1b4736]">View all</Link>
          </div>
          {loadingFeatured && <ProductGridSkeleton />}
          {errorFeatured && <ErrorMessage message={errorFeatured} />}
          {!loadingFeatured && !errorFeatured && featured.length === 0 && (
            <EmptyState message="No featured products at the moment. Check back soon!" />
          )}
          {!loadingFeatured && !errorFeatured && featured.length > 0 && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Near-Expiry Offers ── */}
      <section className="pb-14">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <h2 className="text-[30px] font-semibold leading-tight text-[#152f25]">Limited Time Offers (Near-Expiry)</h2>
          <p className="mb-5 mt-2 text-sm text-[#687b72]">
            In-stock items expiring within 7 days — discounted to reduce waste.
          </p>
          {loadingNearExpiry && <ProductGridSkeleton />}
          {errorNearExpiry && <ErrorMessage message={errorNearExpiry} />}
          {!loadingNearExpiry && !errorNearExpiry && nearExpiry.length === 0 && (
            <EmptyState message="No near-expiry offers right now. Check back tomorrow!" />
          )}
          {!loadingNearExpiry && !errorNearExpiry && nearExpiry.length > 0 && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
              {nearExpiry.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer />
      {isAuthenticated && user?.role === 'CUSTOMER' && <MobileBottomNav activeKey="shop" />}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-components (private to this file)
───────────────────────────────────────────── */

/**
 * Displays a single product card.
 * @param {Object} product - ProductResponse from the API
 */
function ProductCard({ product }) {
  // Prefer the batch-aware flag from the API; fall back to the legacy single expiryDate
  const isNearExpiry = product.hasNearExpiryBatches
    ?? (product.expiryDate
      ? Math.ceil((new Date(product.expiryDate) - new Date()) / 86400000) <= 7
      : false);

  // Show the earliest batch expiry date when available, otherwise the legacy field
  const expiryLabel = product.earliestExpiryDate ?? product.expiryDate;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group overflow-hidden rounded-2xl border border-[#dde3df] bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(14,54,37,0.12)]"
    >
      {/* Product image or placeholder */}
      {product.imageUrl ? (
        <>
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-36 w-full object-cover transition-opacity group-hover:opacity-95 sm:h-44"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }}
          />
          <div
            style={{ display: 'none' }}
            className="h-36 w-full items-center justify-center bg-[#e8f1eb] text-4xl text-[#6f8f80] sm:h-44"
          >
            🥦
          </div>
        </>
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-[#e8f1eb] text-4xl text-[#6f8f80] sm:h-44">
          🥦
        </div>
      )}

      <div className="flex min-h-37 flex-col p-3 sm:p-4">
        {product.category && (
          <span className="mb-1 inline-flex w-fit rounded-full bg-[#e9f2ec] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2d664d]">
            {product.category}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold text-[#1d3128] sm:text-[15px]">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 line-clamp-1 text-xs text-[#7a8b83]">{product.description}</p>
        )}

        <div className="mt-auto space-y-1 pt-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              {product.discountPercentage ? (
                <>
                  <div className="text-xs text-[#ad3d3d] line-through">
                    {formatPrice(product.price, product.unit)}
                  </div>
                  <div className="text-base font-bold text-[#123f2f]">
                    {formatPrice(calculateDiscountedPrice(product.price, product.discountPercentage), product.unit)}
                  </div>
                  <div className="mt-1 inline-flex w-fit rounded bg-[#f6dede] px-1.5 py-0.5 text-[10px] font-semibold text-[#af3434]">
                    {product.discountPercentage}% OFF
                  </div>
                </>
              ) : (
                <span className="text-base font-bold text-[#123f2f]">{formatPrice(product.price, product.unit)}</span>
              )}
            </div>
            {!product.inStock && (
              <span className="rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[10px] font-semibold text-[#8a8a8a]">Out of stock</span>
            )}
          </div>
          {/* Near-expiry badge — highlights discount opportunity */}
          {isNearExpiry && expiryLabel && (
            <div className="rounded bg-[#f5d8d8] px-2 py-1 text-center text-[11px] font-semibold text-[#b02e2e]">
              🕐 Expires {expiryLabel}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * Skeleton grid shown while products are loading.
 */
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-[#dde3df] bg-white animate-pulse">
          <div className="h-36 w-full bg-[#e7ebe8] sm:h-44" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 rounded bg-[#e7ebe8]" />
            <div className="h-4 w-2/3 rounded bg-[#e7ebe8]" />
            <div className="h-3 w-full rounded bg-[#e7ebe8]" />
            <div className="mt-2 h-4 w-1/4 rounded bg-[#e7ebe8]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Inline error message for a failed section. */
function ErrorMessage({ message }) {
  return (
    <div className="rounded-lg border border-[#f1caca] bg-[#fff2f2] px-4 py-3 text-sm text-[#b63a3a]">
      {message}
    </div>
  );
}

/** Empty-state placeholder when a section returns no results. */
function EmptyState({ message }) {
  return (
    <div className="rounded-lg border border-dashed border-[#d8dfda] bg-white px-4 py-10 text-center text-sm text-[#7a8781]">
      {message}
    </div>
  );
}
