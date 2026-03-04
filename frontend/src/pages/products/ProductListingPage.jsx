import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../../services/productService';

/**
 * Page Layer – Public product listing page.
 * Allows visitors and authenticated users to browse, search, filter by category,
 * and sort the full product catalogue. Supports URL-driven state so results are
 * shareable and the browser back button works correctly.
 */
export default function ProductListingPage() {
  // Sync filter state with URL query params so results are bookmarkable
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch]     = useState(searchParams.get('search')   || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy]     = useState(searchParams.get('sortBy')   || '');
  const [page, setPage]         = useState(Number(searchParams.get('page') || 0));

  const [result, setResult]         = useState(null);   // ProductPageResponse
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // ── Fetch category list once on mount ──
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([])); // non-critical; dropdown just stays empty
  }, []);

  // ── Fetch products whenever filters or page change ──
  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError(null);

    // Keep URL in sync with current filter state
    const params = {};
    if (search)   params.search   = search;
    if (category) params.category = category;
    if (sortBy)   params.sortBy   = sortBy;
    if (page > 0) params.page     = page;
    setSearchParams(params, { replace: true });

    getProducts({ search, category, sortBy, page, size: 12 })
      .then(setResult)
      .catch(() => setError('Could not load products. Please try again.'))
      .finally(() => setLoading(false));
  }, [search, category, sortBy, page, setSearchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to page 0 whenever a filter changes (prevents empty pages)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
  };

  const handleCategoryChange = (val) => {
    setCategory(val);
    setPage(0);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navigation ── */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-green-600 tracking-tight">
            UrbanFresh
          </Link>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-green-700 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">All Products</h1>

        {/* ── Search + Filter + Sort bar ── */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Category filter */}
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="">Sort: Name A–Z</option>
            <option value="price_asc">Sort: Price Low–High</option>
            <option value="price_desc">Sort: Price High–Low</option>
          </select>
        </div>

        {/* ── Results summary ── */}
        {result && !loading && (
          <p className="text-sm text-gray-500 mb-4">
            {result.totalElements === 0
              ? 'No products found.'
              : `Showing ${result.products.length} of ${result.totalElements} products`}
          </p>
        )}

        {/* ── Product grid ── */}
        {loading && <ProductGridSkeleton />}

        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && result?.products.length === 0 && (
          <div className="text-gray-400 bg-white border border-dashed border-gray-200 rounded-lg px-4 py-16 text-sm text-center">
            No products match your search. Try different keywords or clear the filters.
          </div>
        )}

        {!loading && !error && result?.products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {result.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {result && result.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {result.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(result.totalPages - 1, p + 1))}
              disabled={page >= result.totalPages - 1}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="bg-gray-800 text-gray-400 text-center py-6 text-sm mt-10">
        © {new Date().getFullYear()} UrbanFresh. Reducing food waste, one deal at a time.
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-components (private to this file)
───────────────────────────────────────────── */

/**
 * Renders a single product card showing name, category, price,
 * stock status, and a near-expiry badge when expiryDate is set.
 *
 * @param {Object} product - ProductResponse from the API
 */
function ProductCard({ product }) {
  // A product is near-expiry when its expiryDate is within 7 days from today
  const isNearExpiry = product.expiryDate
    ? Math.ceil((new Date(product.expiryDate) - new Date()) / 86400000) <= 7
    : false;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
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

        <div className="mt-auto space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-green-700 font-bold">${Number(product.price).toFixed(2)}</span>
            {!product.inStock && (
              <span className="text-xs text-red-500 font-medium">Out of stock</span>
            )}
          </div>
          {/* Near-expiry badge — highlights discount opportunity */}
          {isNearExpiry && (
            <div className="text-xs bg-amber-100 text-amber-700 rounded px-2 py-1 text-center font-medium">
              🕐 Expires {product.expiryDate}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Skeleton grid shown while products are loading. */
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
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
