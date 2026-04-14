import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../../services/productService';
import Navbar from '../../components/Navbar';
import SearchBar from '../../components/SearchBar';
import { formatPrice, calculateDiscountedPrice } from '../../utils/priceUtils';

/**
 * Page Layer – Public product listing page.
 * Allows visitors and authenticated users to browse, search, filter by category,
 * and sort the full product catalogue.
 *
 * State architecture (fixes keystroke-per-request bug):
 *  - inputValue     : local state bound to the <SearchBar> input. Changes on every
 *                     keystroke but is NEVER a dependency of the product fetch.
 *  - committedSearch: derived directly from the URL (?search=). Only changes when
 *                     the user explicitly submits a search or selects a suggestion.
 *  - All other filter params (category, sortBy, page) are also derived from the URL.
 *
 * The URL is the single source of truth for all committed filter state, which means
 * browser back/forward navigation correctly restores the previous search results.
 */
export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Derive committed filter state directly from the URL ─────────────────────
  // These are NOT useState — they are plain derived values. Changing the URL
  // (via setSearchParams) updates them, which in turn re-runs the fetch effect.
  const committedSearch = searchParams.get('search')   || '';
  const category        = searchParams.get('category') || '';
  const sortBy          = searchParams.get('sortBy')   || '';
  const page            = Number(searchParams.get('page') || 0);

  // ── Local input state — only for what's typed in the search box ─────────────
  // Initialised from the URL on mount so a bookmarked/shared URL pre-fills the input.
  // This state MUST NOT be a dependency of the product fetch — that's the core fix.
  const [inputValue, setInputValue] = useState(committedSearch);

  // Keep inputValue in sync when the URL changes from browser back/forward.
  // We track the previous committed value with a ref to avoid re-running on
  // every render caused by other URL param changes (category, sort, page).
  const prevCommittedRef = useRef(committedSearch);
  useEffect(() => {
    if (committedSearch !== prevCommittedRef.current) {
      setInputValue(committedSearch);
      prevCommittedRef.current = committedSearch;
    }
  }, [committedSearch]);

  const [result, setResult]         = useState(null);   // ProductPageResponse
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // ── Fetch category list once on mount ──────────────────────────────────────
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([])); // non-critical; dropdown stays empty
  }, []);

  // ── Fetch products whenever committed filter state (URL params) change ──────
  // inputValue is intentionally absent from this dependency array.
  // Typing updates inputValue only; the fetch only fires when the URL changes.
  useEffect(() => {
    setLoading(true);
    setError(null);
    getProducts({ search: committedSearch, category, sortBy, page, size: 12 })
      .then(setResult)
      .catch(() => setError('Could not load products. Please try again.'))
      .finally(() => setLoading(false));
  }, [committedSearch, category, sortBy, page]);

  // ── URL mutation helpers ────────────────────────────────────────────────────

  /**
   * Writes a new committed search term to the URL, which triggers the fetch effect.
   * Resets the page to 0 so the first results page is always shown on a new search.
   */
  const commitSearch = (value) => {
    const trimmed = value.trim();
    setInputValue(trimmed); // keep the input box in sync
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (trimmed) next.set('search', trimmed); else next.delete('search');
      next.delete('page'); // always back to page 0 on a new search
      return next;
    });
  };

  const handleCategoryChange = (val) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) next.set('category', val); else next.delete('category');
      next.delete('page');
      return next;
    });
  };

  const handleSortChange = (val) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) next.set('sortBy', val); else next.delete('sortBy');
      next.delete('page');
      return next;
    });
  };

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newPage > 0) next.set('page', String(newPage)); else next.delete('page');
      return next;
    }, { replace: true }); // replace so paging doesn't pollute browser history
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navigation (auth-aware via shared Navbar) ── */}
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">All Products</h1>

        {/* ── Search + Filter + Sort bar ── */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
          {/* Search — uses SearchBar which keeps inputValue separate from the fetch */}
          <SearchBar
            value={inputValue}
            onChange={setInputValue}
            onCommit={commitSearch}
          />

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
              onClick={() => handlePageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {result.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(result.totalPages - 1, page + 1))}
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
    <Link
      to={`/products/${product.id}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group"
    >
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-44 object-cover group-hover:opacity-95 transition-opacity"
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
            <div className="flex flex-col">
              {product.discountPercentage ? (
                <>
                  <div className="text-xs text-red-600 line-through">
                    {formatPrice(product.price, product.unit)}
                  </div>
                  <div className="text-green-700 font-bold">
                    {formatPrice(calculateDiscountedPrice(product.price, product.discountPercentage), product.unit)}
                  </div>
                  <div className="text-xs font-semibold text-green-600 bg-green-50 px-1 rounded">
                    {product.discountPercentage}% OFF
                  </div>
                </>
              ) : (
                <span className="text-green-700 font-bold">{formatPrice(product.price, product.unit)}</span>
              )}
            </div>
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
    </Link>
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
