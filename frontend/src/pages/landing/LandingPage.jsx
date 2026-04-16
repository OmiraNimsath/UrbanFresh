import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedProducts, getNearExpiryProducts } from '../../services/productService';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/priceUtils';

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Navigation (auth-aware via shared Navbar) ── */}
      <Navbar />

      {/* ── Hero ── */}
      <section className="bg-green-600 text-white py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Fresh Groceries, Smart Deals
        </h1>
        <p className="text-lg md:text-xl text-green-100 max-w-xl mx-auto mb-8">
          Shop quality produce and save big on near-expiry offers — good for your wallet
          and the planet.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          {isAuthenticated ? (
            /* Authenticated hero CTAs — skip sign-in prompts */
            <>
              <Link
                to="/products"
                className="px-6 py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors"
              >
                Browse Products
              </Link>
              <Link
                to={heroDashboard}
                className="px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                My Dashboard
              </Link>
            </>
          ) : (
            /* Guest hero CTAs */
            <>
              <Link
                to="/register"
                className="px-6 py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Log In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">⭐ Featured Products</h2>
          {loadingFeatured && <ProductGridSkeleton />}
          {errorFeatured && <ErrorMessage message={errorFeatured} />}
          {!loadingFeatured && !errorFeatured && featured.length === 0 && (
            <EmptyState message="No featured products at the moment. Check back soon!" />
          )}
          {!loadingFeatured && !errorFeatured && featured.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Near-Expiry Offers ── */}
      <section className="bg-amber-50 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">🕐 Near-Expiry Offers</h2>
          <p className="text-sm text-gray-500 mb-6">
            In-stock items expiring within 7 days — discounted to reduce waste.
          </p>
          {loadingNearExpiry && <ProductGridSkeleton />}
          {errorNearExpiry && <ErrorMessage message={errorNearExpiry} />}
          {!loadingNearExpiry && !errorNearExpiry && nearExpiry.length === 0 && (
            <EmptyState message="No near-expiry offers right now. Check back tomorrow!" />
          )}
          {!loadingNearExpiry && !errorNearExpiry && nearExpiry.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {nearExpiry.map((product) => (
                <ProductCard key={product.id} product={product} showExpiry />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-100 border-t border-gray-200 text-gray-500 text-center py-6 text-sm mt-auto">
        © {new Date().getFullYear()} UrbanFresh. Reducing food waste, one deal at a time.
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-components (private to this file)
───────────────────────────────────────────── */

/**
 * Displays a single product card.
 * @param {Object}  product    - ProductResponse from the API
 * @param {boolean} showExpiry - whether to show the expiry date badge
 */
function ProductCard({ product, showExpiry = false }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
    >
      {/* Product image or placeholder */}
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-44 object-cover"
        />
      ) : (
        <div className="w-full h-44 bg-green-100 flex items-center justify-center text-green-400 text-4xl">
          🥦
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        {product.category && (
          <span className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">
            {product.category}
          </span>
        )}
        <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{product.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between">
          <span className="text-green-700 font-bold">{formatPrice(product.price, product.unit)}</span>
          {!product.inStock && (
            <span className="text-xs text-red-500 font-medium">Out of stock</span>
          )}
        </div>

        {/* Show expiry badge only in the near-expiry section */}
        {showExpiry && product.expiryDate && (
          <div className="mt-2 text-xs bg-amber-100 text-amber-700 rounded px-2 py-1 text-center font-medium">
            Expires {product.expiryDate}
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * Skeleton grid shown while products are loading.
 */
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
          <div className="w-full h-44 bg-gray-200" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-1/4 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Inline error message for a failed section. */
function ErrorMessage({ message }) {
  return (
    <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
      {message}
    </div>
  );
}

/** Empty-state placeholder when a section returns no results. */
function EmptyState({ message }) {
  return (
    <div className="text-gray-400 bg-white border border-dashed border-gray-200 rounded-lg px-4 py-10 text-sm text-center">
      {message}
    </div>
  );
}
